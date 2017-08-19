uniform vec4 _color;
uniform sampler2D tex;

varying vec3 _position;
varying vec3 perturbed;
varying vec2 _uv;
uniform vec3 mice[50];
uniform float time;

const float PI = 3.1415926535897932384626433832795;
const float PI_2 = 1.57079632679489661923;
const float PI_4 = 0.785398163397448309616;

void main() {

	float d = 0.0;
	float wave_duration = 2.0;

	for(int i = 0 ; i < 50; i ++) {
		d += 1.0 / 50.0 * sin((2.0 * PI * distance(vec3(mice[i].xy, 0.), vec3(_uv, 0.)) - 2.0 * PI / wave_duration * (time - mice[i].z)) * 10.0);
	}


	vec4 t_color = texture2D(tex, _uv);
	gl_FragColor = vec4(t_color.xyz + d / 10.0, 1.0);
}
