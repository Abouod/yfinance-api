﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using backend_api.Data;

#nullable disable

namespace backend_api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20240610065453_AddSignatureToDetails")]
    partial class AddSignatureToDetails
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.5")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("backend_api.Models.Details", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("AddressLine")
                        .HasMaxLength(255)
                        .HasColumnType("character varying(255)")
                        .HasColumnName("address_line");

                    b.Property<string>("BankAccount")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("bank_account");

                    b.Property<string>("BankName")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("bank_name");

                    b.Property<string>("Department")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("department");

                    b.Property<string>("Division")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("division");

                    b.Property<string>("EmployeeId")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)")
                        .HasColumnName("employee_id");

                    b.Property<string>("JobTitle")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("job_title");

                    b.Property<string>("ManagerEmail")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("manager_email");

                    b.Property<string>("ManagerId")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)")
                        .HasColumnName("manager_id");

                    b.Property<string>("ManagerName")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("manager_name");

                    b.Property<string>("Passport")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)")
                        .HasColumnName("passport");

                    b.Property<string>("PhoneNumber")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)")
                        .HasColumnName("phone_number");

                    b.Property<string>("Signature")
                        .HasMaxLength(255)
                        .HasColumnType("character varying(255)")
                        .HasColumnName("signature");

                    b.Property<string>("SuperiorEmail")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("superior_email");

                    b.Property<string>("SuperiorId")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)")
                        .HasColumnName("superior_id");

                    b.Property<string>("SuperiorName")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("superior_name");

                    b.Property<int>("UserId")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.HasIndex("UserId")
                        .IsUnique();

                    b.ToTable("Details");
                });

            modelBuilder.Entity("backend_api.Models.User", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("email");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(255)
                        .HasColumnType("character varying(255)")
                        .HasColumnName("full_name");

                    b.Property<string>("Password")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("password");

                    b.Property<string>("RefreshToken")
                        .HasColumnType("text")
                        .HasColumnName("refresh_token");

                    b.Property<DateTime?>("RefreshTokenExpiryTime")
                        .HasColumnType("timestamp with time zone")
                        .HasColumnName("refresh_token_expiry_time");

                    b.HasKey("Id");

                    b.ToTable("Users");
                });

            modelBuilder.Entity("backend_api.Models.Details", b =>
                {
                    b.HasOne("backend_api.Models.User", "User")
                        .WithOne("Details")
                        .HasForeignKey("backend_api.Models.Details", "UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("User");
                });

            modelBuilder.Entity("backend_api.Models.User", b =>
                {
                    b.Navigation("Details");
                });
#pragma warning restore 612, 618
        }
    }
}
