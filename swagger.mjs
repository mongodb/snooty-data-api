import swaggerAutogen from 'swagger-autogen';

const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/routes/builds.ts', './src/routes/projects.ts'];

swaggerAutogen(outputFile, endpointsFiles);