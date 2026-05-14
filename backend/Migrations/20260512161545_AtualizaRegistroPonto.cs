using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AtualizaRegistroPonto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Observacao",
                table: "RegistrosPonto");

            migrationBuilder.AddColumn<double>(
                name: "HorasTrabalhadas",
                table: "RegistrosPonto",
                type: "double precision",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosPonto_UserId",
                table: "RegistrosPonto",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_RegistrosPonto_Users_UserId",
                table: "RegistrosPonto",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RegistrosPonto_Users_UserId",
                table: "RegistrosPonto");

            migrationBuilder.DropIndex(
                name: "IX_RegistrosPonto_UserId",
                table: "RegistrosPonto");

            migrationBuilder.DropColumn(
                name: "HorasTrabalhadas",
                table: "RegistrosPonto");

            migrationBuilder.AddColumn<string>(
                name: "Observacao",
                table: "RegistrosPonto",
                type: "text",
                nullable: true);
        }
    }
}
