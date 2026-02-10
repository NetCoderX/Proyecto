namespace Backend.Dtos;

public record LoginRequest(string Email, string Password);

public record RegistroRequest(string Nombre, string Apellido, string Email, string Password, string Pais);
