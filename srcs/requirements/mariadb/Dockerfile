FROM debian:11

RUN apt-get --quiet update -y \
	&& apt-get --quiet upgrade -y \
	&& apt-get --quiet install -y mariadb-server

ARG DB_NAME
ARG DB_USER
ARG DB_USER_PASSWORD
ARG DB_ROOT_PASSWORD

RUN service mariadb start && mysql -u root -e \
	"CREATE DATABASE IF NOT EXISTS ${DB_NAME}; \
	ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_ROOT_PASSWORD}'; \
	CREATE USER '${DB_USER}'@'%' IDENTIFIED BY '${DB_USER_PASSWORD}'; \
	GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%'; \
	FLUSH PRIVILEGES;"

EXPOSE 3306

ENTRYPOINT ["mysqld", "--bind-address=0.0.0.0"]
