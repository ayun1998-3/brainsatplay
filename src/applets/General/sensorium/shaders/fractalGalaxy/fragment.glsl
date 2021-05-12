#define HISTORY 5

precision mediump float;
varying vec2 vUvs;
varying vec2 vTextureCoord;
varying vec2 resolution;

uniform float amplitude;
uniform float aspect;
uniform vec2 mouse;
uniform vec3 colors[HISTORY];
uniform float times[HISTORY];
uniform float noiseIntensity[HISTORY];

//Inspired by JoshP's Simplicity shader: https://www.shadertoy.com/view/lslGWr
// http://www.fractalforums.com/new-theories-and-research/very-simple-formula-for-fractal-patterns/
float field(in vec3 p) {
	float strength = 7. + .03 * log(1.e-6 + fract(sin(times[HISTORY-1]) * 4373.11));
	float accum = 0.;
	float prev = 0.;
	float tw = 0.;
	for (int i = 0; i < 32; ++i) {
		float mag = dot(p, p);
		p = abs(p) / mag + vec3(-.5, -.4, -1.5);
		float w = exp(-float(i) / 7.);
		accum += w * exp(-strength * pow(abs(mag - prev), 2.3));
		tw += w;
		prev = mag;
	}
	return max(0., 5. * accum / tw - .7);
}

void main() {
    vec2 responsiveScaling = vec2(1.0/((1.0/aspect) * min(1.0,aspect)), 1.0/(1.0 * min(1.0,aspect)));
    vec2 uv = vUvs*responsiveScaling;
	vec3 p = vec3(uv / 4., 0) + vec3(1., -1.3, 0.);
	p += .2 * vec3(sin(times[HISTORY-1] / 16.), sin(times[HISTORY-1] / 12.),  sin(times[HISTORY-1] / 128.));
	float t = field(p);
	float v = (1. - exp((abs(vUvs.x) - 1.) * 6.)) * (1. - exp((abs(vUvs.y) - 1.) * 6.));
	gl_FragColor = mix(.4, 1., v) * vec4(1.8 * t * t * t, 1.4 * t * t, t, 1.0);
}