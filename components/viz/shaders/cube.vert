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
uniform vec3 mice[50];

const float PI = 3.1415926535897932384626433832795;
const float PI_2 = 1.57079632679489661923;
const float PI_4 = 0.785398163397448309616;

varying vec2 _uv;

void main() {

	_uv = uv;

	float d = 0.0;
	float wave_duration = 2.0;

	for(int i = 0 ; i < 50; i ++) {
		float time_since_start = ((time - mice[i].z) - distance(vec3(mice[i].xy, 0.), vec3(_uv, 0.)) * wave_duration);
		//if(time_since_start > 0.0 && time_since_start < PI)
		//	d += time_since_start / 50.0;
		d += 1.0 / 50.0 * sin((2.0 * PI * distance(vec3(mice[i].xy, 0.), vec3(_uv, 0.)) - 2.0 * PI / wave_duration * (time - mice[i].z)) * 10.0);
	}

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}