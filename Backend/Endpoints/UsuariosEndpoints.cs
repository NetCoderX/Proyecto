using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class UsuariosEndpoints
{
    public static IEndpointRouteBuilder MapUsuariosEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/usuarios")
            .WithTags("Usuarios")
            .WithOpenApi();

        group.MapPost("/login", Login)
            .WithName("LoginUsuario")
            .WithSummary("Inicia sesión con email y contraseña");

        group.MapPost("/registrar", Registrar)
            .WithName("RegistrarUsuario")
            .WithSummary("Registra un nuevo usuario");

        return endpoints;
    }

    private static async Task<IResult> Login(LoginRequest request, AppDbContext db)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u =>
            u.Email == request.Email && u.Password == request.Password);

        if (usuario == null)
            return TypedResults.Unauthorized();

        return TypedResults.Ok(new { id = usuario.Id, email = usuario.Email });
    }

    private static async Task<IResult> Registrar(RegistroRequest request, AppDbContext db)
    {
        if (await db.Usuarios.AnyAsync(u => u.Email == request.Email))
            return TypedResults.Conflict(new { message = "El email ya está registrado" });

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

        return TypedResults.Created($"/api/usuarios/{usuario.Id}", new { id = usuario.Id, email = usuario.Email });
    }
}
