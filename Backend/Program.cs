using Backend.Data;
using Backend.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddBackendServices(builder.Configuration);

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}

app.UseBackendPipeline();
app.MapBackendEndpoints();

app.Run();
