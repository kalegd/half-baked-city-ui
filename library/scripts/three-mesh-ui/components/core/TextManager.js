
import { Mesh } from '../../../three/build/three.module.js';
import { BufferGeometryUtils } from '../../../three/examples/jsm/utils/BufferGeometryUtils.js';

import MSDFGlyph from '../../content/MSDFGlyph.js';

/**

Job: 
- Computing glyphs dimensions according to this component's font and content
- Create the text Mesh (call MSDFGlyph for each letter)

Knows:
- The Text component for which it creates Meshes
- The parameters of the text mesh it must return

Note : The architecture formerly supported a second type of text, 'geometry'.
This text type has been dropped for performance reasons, but the architecture remain,
so it's easy to add more text type, like vector font, instanced mesh font...

*/
export default function TextManager( Base = class {} ) {

    return class TextManager extends Base {

        createText() {

            switch ( this.getTextType() ) {

            case 'MSDF' :
                return this.buildMSDFText.call( this );

            }

        }

        /**
         * Called by Text to get the domensions of a particular glyph,
         * in order for InlineManager to compute its position
         */
        getGlyphDimensions( options ) {

            const FONT = options.font;

            const FONT_SIZE = options.fontSize; 

            const GLYPH = options.glyph;

            let width, height, anchor, charOBJ;

            switch ( options.textType ) {

            case 'MSDF' :

                charOBJ = FONT.chars.find( charOBJ => charOBJ.char === GLYPH );

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

            default :
                console.warn(`'${ options.textType }' is not a supported text type`);
                break

            }

        }

        /**
         * Creates a THREE.Plane geometry, with UVs carefully positioned to map a particular
         * glyph on the MSDF texture. Then creates a shaderMaterial with the MSDF shaders,
         * creates a THREE.Mesh, returns it.
         * @private
         */
        buildMSDFText() {

            const component = this;

            const translatedGeom = [];

            this.inlines.forEach( (inline, i)=> {

                translatedGeom[ i ] = new MSDFGlyph( inline, this.getFontFamily() );

                translatedGeom[ i ].translate( inline.offsetX, inline.offsetY, 0 );

            });

            const mergedGeom = BufferGeometryUtils.mergeBufferGeometries( translatedGeom );

            const mesh = new Mesh( mergedGeom, this.getFontMaterial() );

            mesh.renderOrder = Infinity;

            // This is for hiddenOverflow to work
            mesh.onBeforeRender = function() {

                if ( component.updateClippingPlanes ) {

                    component.updateClippingPlanes();

                }

            };

            return mesh

        }

    }

}
