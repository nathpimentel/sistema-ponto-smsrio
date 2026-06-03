using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTimestamps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AtualizadoEm",
                table: "Users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            migrationBuilder.AddColumn<DateTime>(
                name: "CriadoEm",
                table: "Users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            migrationBuilder.AddColumn<DateTime>(
                name: "AtualizadoEm",
                table: "RegistrosPonto",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            migrationBuilder.AddColumn<DateTime>(
                name: "CriadoEm",
                table: "RegistrosPonto",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "AtualizadoEm", table: "Users");
            migrationBuilder.DropColumn(name: "CriadoEm",     table: "Users");
            migrationBuilder.DropColumn(name: "AtualizadoEm", table: "RegistrosPonto");
            migrationBuilder.DropColumn(name: "CriadoEm",     table: "RegistrosPonto");
        }
    }
}
