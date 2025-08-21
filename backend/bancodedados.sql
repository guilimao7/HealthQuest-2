create database HealhQ;
use HealthQ;

create table users(
	id int auto_increment primary key,
	name varchar(255),
    email varchar(255),
    password varchar(255)
);