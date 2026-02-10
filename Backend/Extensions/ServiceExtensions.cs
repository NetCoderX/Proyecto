using Backend.Data;
using Backend.Endpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Scalar.AspNetCore;

namespace Backend.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddBackendServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = BuildConnectionString()
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("No hay cadena de conexión. Añade referencia a Postgres en Railway (Variables).");

        services.AddOpenApi();
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
        services.AddCors(ConfigureCors(configuration));
        services.AddHttpClient();

        return services;
    }

    private static Action<CorsOptions> ConfigureCors(IConfiguration configuration)
    {
        var corsOrigins = new List<string>
        {
            "http://localhost:5173",
            "http://localhost:3000",
            "https://hernan.up.railway.app"
        };

        var extraOrigins = configuration["CORS__AllowedOrigins"];
        if (!string.IsNullOrEmpty(extraOrigins))
            corsOrigins.AddRange(extraOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries));

        return options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
                policy.WithOrigins(corsOrigins.ToArray())
                    .AllowAnyHeader()
                    .AllowAnyMethod());
        };
    }

    private static string? BuildConnectionString()
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
        if (string.IsNullOrEmpty(url)) return null;

        if (url.StartsWith("postgres://"))
            url = "postgresql://" + url["postgres://".Length..];

        if (!url.StartsWith("postgresql://") || !Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri == null)
            return null;

        var userInfo = uri.UserInfo.Split(':', 2);
        var uriUser = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
        var uriPass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var database = uri.AbsolutePath.TrimStart('/');

        return $"Host={uri.Host};Port={uri.Port};Database={database};Username={uriUser};Password={uriPass};SSL Mode=Require;Trust Server Certificate=true";
    }

    public static IApplicationBuilder UseBackendPipeline(this IApplicationBuilder app)
    {
        app.UseCors("AllowFrontend");
        return app;
    }

    public static WebApplication MapBackendEndpoints(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.MapScalarApiReference();
        }

        app.MapWeatherEndpoints();
        app.MapUsuariosEndpoints();

        return app;
    }
}
