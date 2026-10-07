export const ATTRIBUTES = ["a_position", "a_normal", "a_texCoord"];

export const UNIFORMS = [
  "u_model",
  "u_view",
  "u_projection",
  "u_normalMatrix",
  "u_uvScale",
  "u_lightPosition",
  "u_lightColor",
  "u_cameraPosition",
  "u_ambientStrength",
  "u_shininess",
  "u_texture",
  // Lighting component switches (1.0 = on, 0.0 = off) for Challenge F.
  "u_useAmbient",
  "u_useDiffuse",
  "u_useSpecular",
  "u_useTexture",
  "u_baseColor",
];

export const vertexShaderSource = `#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;
uniform float u_uvScale;

out vec3 v_worldPosition;
out vec3 v_normal;
out vec2 v_texCoord;

void main() {
  vec4 worldPosition = u_model * vec4(a_position, 1.0);

  v_worldPosition = worldPosition.xyz;
  v_normal = u_normalMatrix * a_normal;
  v_texCoord = a_texCoord * u_uvScale;

  gl_Position = u_projection * u_view * worldPosition;
}
`;

export const fragmentShaderSource = `#version 300 es

precision highp float;

in vec3 v_worldPosition;
in vec3 v_normal;
in vec2 v_texCoord;

uniform vec3 u_lightPosition;
uniform vec3 u_lightColor;
uniform vec3 u_cameraPosition;

uniform float u_ambientStrength;
uniform float u_shininess;

uniform float u_useAmbient;
uniform float u_useDiffuse;
uniform float u_useSpecular;

uniform sampler2D u_texture;

// Challenge H: 1.0 = use texture, 0.0 = use u_baseColor (rgb + alpha).
uniform float u_useTexture;
uniform vec4 u_baseColor;

out vec4 outColor;

void main() {
  // Interpolation shortens vectors, so always renormalize.
  vec3 N = normalize(v_normal);
  if (!gl_FrontFacing) {
    N = -N;
  }
  vec3 L = normalize(u_lightPosition - v_worldPosition);
  vec3 V = normalize(u_cameraPosition - v_worldPosition);

  float diff = max(dot(N, L), 0.0);

  // reflect() expects the incident direction (light -> surface), hence -L.
  vec3 R = reflect(-L, N);

  // Skip the highlight when the light is behind the surface.
  float spec = 0.0;
  if (diff > 0.0) {
    spec = pow(max(dot(R, V), 0.0), u_shininess);
  }

// Base color: texture, or a flat color with its own alpha.
  vec4 texSample = texture(u_texture, v_texCoord);
  vec3 baseRgb = mix(u_baseColor.rgb, texSample.rgb, u_useTexture);
  float baseAlpha = mix(u_baseColor.a, 1.0, u_useTexture);

  vec3 ambient  = u_useAmbient * u_ambientStrength * baseRgb;
  vec3 diffuse  = u_useDiffuse * diff * u_lightColor * baseRgb;
  float specAmount = u_useSpecular * spec;
  vec3 specular = specAmount * u_lightColor;

  // Add the highlight to alpha so it stays visible on a transparent wall.
  float alpha = clamp(baseAlpha + specAmount, 0.0, 1.0);

  outColor = vec4(ambient + diffuse + specular, alpha);
}
`;