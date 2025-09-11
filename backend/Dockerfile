FROM python:latest

RUN apt-get update && apt-get install -y curl

#Create python virtual environment, isolate local python from system-level python
RUN python -m venv /opt/venv/
ENV PATH=/opt/venv/bin:$PATH

#Sets working directory inside container 
WORKDIR /app 

#Create directory inside container
# RUN mkdir -p /static_folder

COPY requirements.txt /tmp/requirements.txt
# Install dependencies, run within container while building
RUN pip install -r /tmp/requirements.txt

# Copy files from local to container
# COPY ./static-html /static_folder
COPY . .

#Run commands inside container can be sites from react, next.js, angular, flask, django etc
#RUN echo "Hello, Docker!" > index.html
#docker init
#docker build -f Dockerfile -t <imagename> .
#docker run -it <imagename>

#Connect to Docker Hub for development
#for easy access do:
    #docker login --> docker build -f Dockerfile -t <username>/<imagename>:tag . 
    #docker push <username>/<imagename>:tag
    #where tag may be latest or v1.0 etc..
#always remember to expose ports
#docker run -it -p <host_port>:<container_port> <imagename>

# Expose the port that the application will run on
EXPOSE 8000

# Run the application
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Default command launches FastAPI server
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
