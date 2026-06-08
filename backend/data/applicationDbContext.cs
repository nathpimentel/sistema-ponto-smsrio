using Microsoft.EntityFrameworkCore;
using backend.Entities;

namespace backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<RegistroPonto> RegistrosPonto => Set<RegistroPonto>();
}