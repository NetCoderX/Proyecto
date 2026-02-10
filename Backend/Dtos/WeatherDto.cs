namespace Backend.Dtos;

public record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

public record CurrentWeather(double TemperatureC, double TemperatureF);

public record DailyForecast(string Date, double TempMin, double TempMax, string WeatherType);

public record WeeklyForecast(DailyForecast[] Days);
