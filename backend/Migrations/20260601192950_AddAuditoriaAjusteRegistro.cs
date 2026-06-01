using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditoriaAjusteRegistro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AjustadoEmUtc",
                table: "RegistrosPonto",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AjustadoPorUsuarioId",
                table: "RegistrosPonto",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JustificativaAjuste",
                table: "RegistrosPonto",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AjustadoEmUtc",
                table: "RegistrosPonto");

            migrationBuilder.DropColumn(
                name: "AjustadoPorUsuarioId",
                table: "RegistrosPonto");

            migrationBuilder.DropColumn(
                name: "JustificativaAjuste",
                table: "RegistrosPonto");
        }
    }
}
