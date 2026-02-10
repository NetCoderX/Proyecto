using System.Globalization;
using System.Text.Json.Serialization;
using Backend.Dtos;

namespace Backend.Endpoints;

public static class WeatherEndpoints
{
    public static IEndpointRouteBuilder MapWeatherEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/weatherforecast")
            .WithTags("Weather")
            .WithOpenApi();

        group.MapGet("/", GetCurrentWeather)
            .WithName("GetCurrentWeather")
            .WithSummary("Obtiene la temperatura actual (hoy) desde Open-Meteo");

        group.MapGet("/weekly", GetWeeklyForecast)
            .WithName("GetWeeklyForecast")
            .WithSummary("Obtiene el pronóstico semanal (7 días) desde Open-Meteo");

        return endpoints;
    }

    private static async Task<IResult> GetCurrentWeather(IHttpClientFactory httpClientFactory, double? lat, double? lon)
    {
        var (latitude, longitude) = (lat ?? -34.61315, lon ?? -58.37723);
        try
        {
            var latStr = latitude.ToString(CultureInfo.InvariantCulture);
            var lonStr = longitude.ToString(CultureInfo.InvariantCulture);
            var url = $"https://api.open-meteo.com/v1/forecast?latitude={latStr}&longitude={lonStr}&current=temperature_2m";
            var httpClient = httpClientFactory.CreateClient();
            var response = await httpClient.GetFromJsonAsync<OpenMeteoCurrentResponse>(url);
            if (response?.Current?.Temperature2m is null)
                return Results.Problem("No se pudo obtener la temperatura");

            var tempC = response.Current.Temperature2m.Value;
            var tempF = tempC * 9 / 5 + 32;
            return Results.Ok(new CurrentWeather(tempC, Math.Round(tempF, 1)));
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error al obtener el clima: {ex.Message}");
        }
    }

    private static async Task<IResult> GetWeeklyForecast(IHttpClientFactory httpClientFactory, double? lat, double? lon, string? tz)
    {
        var (latitude, longitude) = (lat ?? -34.61315, lon ?? -58.37723);
        var timezone = string.IsNullOrWhiteSpace(tz) ? "America/Argentina/Buenos_Aires" : tz.Trim();
        try
        {
            var latStr = latitude.ToString(CultureInfo.InvariantCulture);
            var lonStr = longitude.ToString(CultureInfo.InvariantCulture);
            var url = $"https://api.open-meteo.com/v1/forecast?latitude={latStr}&longitude={lonStr}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone={Uri.EscapeDataString(timezone)}";
            var httpClient = httpClientFactory.CreateClient();
            var response = await httpClient.GetFromJsonAsync<OpenMeteoDailyResponse>(url);
            if (response?.Daily?.Time is null || response.Daily.Temperature2mMax is null ||
                response.Daily.Temperature2mMin is null || response.Daily.WeatherCode is null)
                return Results.Problem("No se pudo obtener el pronóstico semanal");

            var days = new List<DailyForecast>();
            for (var i = 0; i < response.Daily.Time.Count && i < 7; i++)
            {
                var date = response.Daily.Time[i];
                var tempMax = response.Daily.Temperature2mMax.Count > i ? response.Daily.Temperature2mMax[i] : 0;
                var tempMin = response.Daily.Temperature2mMin.Count > i ? response.Daily.Temperature2mMin[i] : 0;
                var code = response.Daily.WeatherCode.Count > i ? response.Daily.WeatherCode[i] : 0;
                days.Add(new DailyForecast(date, tempMin, tempMax, MapWeatherCode(code)));
            }
            return Results.Ok(new WeeklyForecast([.. days]));
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error al obtener el pronóstico: {ex.Message}");
        }
    }

    private static string MapWeatherCode(int code)
    {
        return code switch
        {
            0 => "sunny",
            95 or 96 or 97 or 98 or 99 => "thunder",
            51 or 53 or 55 or 56 or 57 or 61 or 63 or 65 or 66 or 67 or 80 or 81 or 82 => "rainy",
            _ => "cloudy" // 1-3, 45, 48, 71-77, 85-86, etc.
        };
    }

    private sealed class OpenMeteoCurrentResponse
    {
        [JsonPropertyName("current")]
        public OpenMeteoCurrent? Current { get; set; }
    }

    private sealed class OpenMeteoCurrent
    {
        [JsonPropertyName("temperature_2m")]
        public double? Temperature2m { get; set; }
    }

    private sealed class OpenMeteoDailyResponse
    {
        [JsonPropertyName("daily")]
        public OpenMeteoDaily? Daily { get; set; }
    }

    private sealed class OpenMeteoDaily
    {
        [JsonPropertyName("time")]
        public List<string> Time { get; set; } = [];
        [JsonPropertyName("temperature_2m_max")]
        public List<double> Temperature2mMax { get; set; } = [];
        [JsonPropertyName("temperature_2m_min")]
        public List<double> Temperature2mMin { get; set; } = [];
        [JsonPropertyName("weather_code")]
        public List<int> WeatherCode { get; set; } = [];
    }
}
