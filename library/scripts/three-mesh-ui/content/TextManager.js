
/*

Job: Takes glyphs (strings), positions, and text types, returns meshes to Text

Knows:
	- The Text component for which it creates Meshes
	- The parameters of the text mesh it must return

To learn more about the differences between Text types :
https://github.com/felixmariotto/three-mesh-ui/wiki/Choosing-a-Text-type

*/

import { Mesh, ShaderMaterial } from '../../three/build/three.module.js';
import { BufferGeometryUtils } from '../../three/examples/jsm/utils/BufferGeometryUtils.js';

import GeometryGlyph from './glyphs/GeometryGlyph.js';
import MSDFGlyph from './glyphs/MSDFGlyph.js';

export default function TextContent() {

	return {
		create,
		getGlyphDimensions
	};

	//

	function getGlyphDimensions( options ) {

		// Constants common to all types of font

		const FONT = options.font;

		const FONT_SIZE = options.fontSize; 

		const GLYPH = options.glyph;

		let width, height, ascender, anchor;

		// Depending on the type of font, the way to compute a glyph dimensions vary

		switch ( options.textType ) {

			case 'geometry' :

				width = FONT.data.glyphs[ GLYPH ] ? FONT.data.glyphs[ GLYPH ].ha * ( FONT_SIZE / FONT.data.resolution ) : 0 ;

				height = FONT.data.glyphs[ GLYPH ] ? FONT.data.lineHeight * ( FONT_SIZE / FONT.data.resolution ) : 0 ;

				ascender = FONT.data.glyphs[ GLYPH ] ? FONT.data.ascender * ( FONT_SIZE / FONT.data.resolution ) : 0 ;

				// world-space length between lowest point and the text cursor position
				anchor = height - ascender;

				if ( GLYPH.match(/\s/) ) height = 0;

				return {
					width,
					height,
					anchor
				};

			//

			case 'MSDF' :

				const charOBJ = FONT.chars.find( charOBJ => charOBJ.char === GLYPH );

				width = charOBJ ? (charOBJ.width * FONT_SIZE) / FONT.common.lineHeight : FONT_SIZE / 3 ;

				if ( GLYPH === '\n' ) width = 0;

				height = charOBJ ? (charOBJ.height * FONT_SIZE) / FONT.common.lineHeight : 0 ;

				// world-space length between lowest point and the text cursor position
				anchor = charOBJ ? ((charOBJ.yoffset + charOBJ.height - FONT.common.base) * FONT_SIZE) / FONT.common.lineHeight : 0 ;

				return {
					width,
					height,
					anchor
				};

		};

	};

	//

	function create( options ) {

		switch ( options.textType ) {

			case 'geometry' :
				return buildGeometryText( options );

			case 'MSDF' :
				return buildMSDFText( options );

		};

	};

	// Create a THREE.BufferGeometry with the shape of the required glyph,
	// then returns a mesh made of this geometry and the passed fontMaterial.
	// Called only when the Text is created with 'textType: "geometry"'

	function buildGeometryText( options ) {

		const translatedGeom = [];

		options.inlines.forEach( (inline, i)=> {

			translatedGeom[ i ] = GeometryGlyph( inline.glyph, inline.fontSize, options.fontFamily );

			translatedGeom[ i ].translate( inline.offsetX, inline.offsetY, 0 );

		});

		const mergedGeom = BufferGeometryUtils.mergeBufferGeometries( translatedGeom );

		return new Mesh( mergedGeom, options.fontMaterial );

	};

	// Creates a THREE.Plane geometry, with UVs carefully positioned to map a particular
	// glyph on the MSDF texture. Then creates a shaderMaterial with the MSDF shaders,
	// creates a THREE.Mesh, returns it.
	// Called only when the Text is created with 'textType: "MSDF"' (the default)

	function buildMSDFText( options ) {

		const translatedGeom = [];

		options.inlines.forEach( (inline, i)=> {

			translatedGeom[ i ] = MSDFGlyph( inline, options.fontFamily );

			translatedGeom[ i ].translate( inline.offsetX, inline.offsetY, 0 );

		});

		const mergedGeom = BufferGeometryUtils.mergeBufferGeometries( translatedGeom );

		//

		const MATERIAL = new ShaderMaterial( {
			uniforms: { u_texture: { value: options.fontTexture }},
			transparent: true,
			vertexShader: VertexShader(),
			fragmentShader: FragmentShader( options.fontColor, options.fontOpacity ),
		});

		//

		const mesh = new Mesh( mergedGeom, MATERIAL );

		mesh.renderOrder = Infinity;

		return mesh

	};

};

////////////////
// MSDF shaders
////////////////

function VertexShader() {

	return `
		varying vec2 vUv;

		void main() {
			vUv = uv;
			vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
			gl_Position = projectionMatrix * mvPosition;
			gl_Position.z-= 0.005;
		}
	`

};

// returns an MSDF fragment shader with the right font color and opacity

function FragmentShader( color, opacity ) {

	opacity = String( opacity );

	if ( !opacity.includes('.') ) {

		if ( opacity.includes(',') ) {

			opacity = opacity.replace( ',', '.' )

		} else {

			opacity = opacity + '.0';

		};

	};

	return `
		#ifdef GL_OES_standard_derivatives
		#extension GL_OES_standard_derivatives : enable
		#endif

		uniform sampler2D u_texture;

		varying vec2 vUv;

		float median(float r, float g, float b) {
			return max(min(r, g), min(max(r, g), b));
		}

		void main() {
			vec3 sample = texture2D( u_texture, vUv ).rgb;
			float sigDist = median( sample.r, sample.g, sample.b ) - 0.5;
			float alpha = clamp( sigDist / fwidth( sigDist ) + 0.5, 0.0, 1.0 );
			gl_FragColor = vec4( vec3(${ color.r + ',' + color.g + ',' + color.b }), min( alpha, ${ opacity } ) );
		}
	`

};
