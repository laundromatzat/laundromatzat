module.exports = {
  plugins: {
    'postcss-preset-env': {
      stage: 3, // Adjust stage as needed, stage 3 is a good default
      features: {
        'nesting-rules': true // Example: enable nesting
      }
    }
  }
};
