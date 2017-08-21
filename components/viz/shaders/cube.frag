uniform vec4 _color;
uniform sampler2D tex;

varying vec2 _uv;
uniform vec3 mice[50];
uniform float time;

const float PI = 3.1415926535897932384626433832795;
const float PI_2 = 1.57079632679489661923;
const float PI_4 = 0.785398163397448309616;

void main() {

	float d = 0.0;
	float wave_duration = 5.0;

	for(int i = 0 ; i < 50; i ++) {
		d += 1.0 / 50.0 * sin((2.0 * PI * distance(vec3(mice[i].xy, 0.), vec3(_uv, 0.)) - 2.0 * PI / wave_duration * (time - mice[i].z)) * 10.0);
	}


	vec3 c = texture2D(tex, _uv).xyz;
	
    vec3 norm = normalize(c);
    
    vec3 div = vec3(0.1) * norm.z;    
    vec3 rbcol = vec3(0.5, 0.25, 0.2) + 0.2 * cross(norm.xyz, vec3(0.5, -0.1, 0.3));

	vec3 col = rbcol + div - d / 300.0;
	float gamma = 1.7;

	float L = .2126 * pow(col.x, gamma) + 0.7152 * pow(col.y, gamma) + .0722 * pow(col.z, gamma);
    
	gl_FragColor = vec4(vec3(L), 1.0);
}
