using Microsoft.EntityFrameworkCore;
using backend.entities;

namespace backend.data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<RegistroPonto> RegistrosPonto => Set<RegistroPonto>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(u => u.Email)
                .HasMaxLength(320);

            entity.HasIndex(u => u.Email)
                .IsUnique();
        });
    }
}
