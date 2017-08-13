/* these are already supplied ...

uniform mat4 viewMatrix;
uniform vec3 cameraPosition;

*/
uniform vec4 _color;

varying vec3 _position;
varying vec3 perturbed;
varying vec2 _uv;

void main() {

	gl_FragColor = vec4(_color.xyz + perturbed.z / 10.0, 1.0);
}
