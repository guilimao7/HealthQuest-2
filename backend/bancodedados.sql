create database HealhQ;
use HealthQ;

create table users(
	id int auto_increment primary key,
	name varchar(255),
    email varchar(255),
    password varchar(255)
);

create table recipes(
    id int auto_increment primary key,
    user_id int,
    title varchar(255),
    ingredients text,
    instructions text,
    FOREIGN KEY (user_id) REFERENCES users(id)
);