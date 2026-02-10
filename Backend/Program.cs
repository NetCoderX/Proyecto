using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Connection string: Railway inyecta PGHOST/PGPORT/etc. o DATABASE_URL
static string BuildConnectionString()
{
    var pgHost = Environment.GetEnvironmentVariable("PGHOST");
    if (!string.IsNullOrEmpty(pgHost))
    {
        var port = Environment.GetEnvironmentVariable("PGPORT") ?? "5432";
        var user = Environment.GetEnvironmentVariable("PGUSER") ?? Environment.GetEnvironmentVariable("POSTGRES_USER");
        var pass = Environment.GetEnvironmentVariable("PGPASSWORD") ?? Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");
        var db = Environment.GetEnvironmentVariable("PGDATABASE") ?? Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "railway";
        if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
            return $"Host={pgHost};Port={port};Database={db};Username={user};Password={pass};SSL Mode=Require;Trust Server Certificate=true";
    }
    var url = (Environment.GetEnvironmentVariable("DATABASE_URL") ?? "").Trim();
    if (!string.IsNullOrEmpty(url))
    {
        if (url.StartsWith("postgres://")) url = "postgresql://" + url[11..];
        return url;
    }
    return null!;
}

var connectionString = BuildConnectionString()
    ?? builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
    throw new InvalidOperationException("No hay cadena de conexión. Añade referencia a Postgres en Railway (Variables).");

builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// CORS para permitir el frontend (local y producción)
var corsOrigins = new List<string> { "http://localhost:5173", "http://localhost:3000" };
var extraOrigins = builder.Configuration["CORS__AllowedOrigins"];
if (!string.IsNullOrEmpty(extraOrigins))
    corsOrigins.AddRange(extraOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries));
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(corsOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Crear la base de datos si no existe
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    // UI de documentación (Scalar)
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

// Habilitar CORS para el frontend
app.UseCors("AllowFrontend");

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapPost("/api/usuarios/login", async (LoginRequest request, AppDbContext db) =>
{
    var usuario = await db.Usuarios.FirstOrDefaultAsync(u =>
        u.Email == request.Email && u.Password == request.Password);
    if (usuario == null)
        return Results.Unauthorized();
    return Results.Ok(new { id = usuario.Id, email = usuario.Email });
})
.WithName("LoginUsuario");

app.MapPost("/api/usuarios/registrar", async (RegistroRequest request, AppDbContext db) =>
{
    if (await db.Usuarios.AnyAsync(u => u.Email == request.Email))
        return Results.Conflict(new { message = "El email ya está registrado" });

    var usuario = new Usuario
    {
        Nombre = request.Nombre,
        Apellido = request.Apellido,
        Email = request.Email,
        Password = request.Password,
        Pais = request.Pais
    };
    db.Usuarios.Add(usuario);
    await db.SaveChangesAsync();
    return Results.Created($"/api/usuarios/{usuario.Id}", new { id = usuario.Id, email = usuario.Email });
})
.WithName("RegistrarUsuario");

app.Run();

record LoginRequest(string Email, string Password);

record RegistroRequest(string Nombre, string Apellido, string Email, string Password, string Pais);

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
