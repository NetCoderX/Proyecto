using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// CORS para permitir el frontend (Vite dev y Docker)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
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
