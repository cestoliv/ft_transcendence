FROM nginx:alpine

ARG NGINX_SERVER_NAME_BACK
ARG NGINX_SERVER_NAME_FRONT

COPY nginx.conf /etc/nginx/nginx.conf

RUN sed -i "s/NGINX_SERVER_NAME_BACK/$NGINX_SERVER_NAME_BACK/g" /etc/nginx/nginx.conf
RUN sed -i "s/NGINX_SERVER_NAME_FRONT/$NGINX_SERVER_NAME_FRONT/g" /etc/nginx/nginx.conf

CMD ["nginx"]
