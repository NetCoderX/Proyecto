using Backend.Dtos;

namespace Backend.Endpoints;

public static class WeatherEndpoints
{
    private static readonly string[] Summaries =
    [
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    ];

    public static IEndpointRouteBuilder MapWeatherEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/weatherforecast")
            .WithTags("Weather")
            .WithOpenApi();

        group.MapGet("/", GetForecast)
            .WithName("GetWeatherForecast")
            .WithSummary("Obtiene el pronóstico del tiempo");

        return endpoints;
    }

    private static WeatherForecast[] GetForecast()
    {
        return Enumerable.Range(1, 5)
            .Select(index => new WeatherForecast(
                DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                Random.Shared.Next(-20, 55),
                Summaries[Random.Shared.Next(Summaries.Length)]))
            .ToArray();
    }
}
