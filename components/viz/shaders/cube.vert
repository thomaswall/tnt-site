/* these are already supplied ...

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;	

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec2 uv2;
*/

uniform vec4 _color;
uniform float time;

const float PI = 3.1415926535897932384626433832795;
const float PI_2 = 1.57079632679489661923;
const float PI_4 = 0.785398163397448309616;

varying vec2 _uv;

varying vec3 _position;
varying vec3 perturbed;

void main() {

	_position = position;
	_uv = uv;

	perturbed = position + vec3(0., 0., cos(time / 10.0 / 5.0 * distance(vec3(0., 0., 0.), vec3(position.xy, 0.))));
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}