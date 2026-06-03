using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
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

        modelBuilder.Entity<RegistroPonto>(entity =>
        {
            entity.HasIndex(r => new { r.UserId, r.Data })
                .HasDatabaseName("IX_RegistrosPonto_UserId_Data");
        });
    }

    public override int SaveChanges()
    {
        PreencherTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        PreencherTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void PreencherTimestamps()
    {
        var agora = DateTime.UtcNow;

        foreach (EntityEntry entry in ChangeTracker.Entries())
        {
            if (entry.Entity is User user)
            {
                if (entry.State == EntityState.Added)
                {
                    user.CriadoEm = agora;
                    user.AtualizadoEm = agora;
                }
                else if (entry.State == EntityState.Modified)
                {
                    user.AtualizadoEm = agora;
                }
            }
            else if (entry.Entity is RegistroPonto registro)
            {
                if (entry.State == EntityState.Added)
                {
                    registro.CriadoEm = agora;
                    registro.AtualizadoEm = agora;
                }
                else if (entry.State == EntityState.Modified)
                {
                    registro.AtualizadoEm = agora;
                }
            }
        }
    }
}
