
class GLBBuilder {

    // -----------------------------------------------------------------------------------------------------------------
    // region Shaders

    VERTEX_SHADER_SOURCE = `#version 300 es
        precision mediump float;

        in vec3 aVertexPosition;
        in vec3 aVertexNormal;
        in vec2 aVertexTextureCoordinate;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform mat3 uNormalMatrix;

        uniform vec3 uAmbientColor;
        uniform vec3 uLightingDirection;
        uniform vec3 uDirectionalColor;

        uniform bool uUseLighting;

        out vec3 vVertexPosition;
        out vec2 vVertexTextureCoordinate;

        out vec3 vLightWeighting;

        void main(void) {

            vVertexTextureCoordinate = aVertexTextureCoordinate;
            vVertexPosition = aVertexPosition;

            gl_PointSize = 4.0;
            gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);

            if (!uUseLighting) {
                vLightWeighting = vec3(1.0, 1.0, 1.0);
            }
            else {
                vec3 transformedNormal = uNormalMatrix * aVertexNormal;
                float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
                vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;
            }
        }
    `;

    FRAGMENT_SHADER_SOURCE = `#version 300 es
        precision mediump float;

        in vec3 vVertexPosition;
        in vec2 vVertexTextureCoordinate;

        in vec3 vLightWeighting;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform mat3 uNormalMatrix;

        uniform vec3 uAmbientColor;
        uniform vec3 uLightingDirection;
        uniform vec3 uDirectionalColor;

        uniform bool uUseLighting;

        uniform sampler2D uTexture;

        out vec4 color;

        void main(void) {

            if (uUseLighting) {

                vec4 textureColor = texture(uTexture, vec2(vVertexTextureCoordinate.s, vVertexTextureCoordinate.t));
                color = vec4(textureColor.rgb * vLightWeighting, textureColor.a);
            }
            else {

                color = texture(uTexture, vec2(vVertexTextureCoordinate.s, vVertexTextureCoordinate.t));
            }
        }
    `;

    // endregion
    // -----------------------------------------------------------------------------------------------------------------



    // -----------------------------------------------------------------------------------------------------------------
    // region Attributes

    gl = null;
    mShaderProgram = null;
    mShaderProgramInfo = null;

    // endregion
    // -----------------------------------------------------------------------------------------------------------------



    // -----------------------------------------------------------------------------------------------------------------
    // region Constructor

    constructor(gl) {

        this.gl = gl;

        this.mShaderProgram = Utils.initShaderProgram(gl, this.VERTEX_SHADER_SOURCE, this.FRAGMENT_SHADER_SOURCE);

        this.mShaderProgramInfo = {

            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(this.mShaderProgram, 'aVertexPosition'),
                vertexNormal: this.gl.getAttribLocation(this.mShaderProgram, 'aVertexNormal'),
                vertexTextureCoordinate: this.gl.getAttribLocation(this.mShaderProgram, 'aVertexTextureCoordinate'),
            },

            uniformLocations: {

                projectionMatrix: this.gl.getUniformLocation(this.mShaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(this.mShaderProgram, 'uModelViewMatrix'),
                normalMatrix: this.gl.getUniformLocation(this.mShaderProgram, 'uNormalMatrix'),

                useLightning: this.gl.getUniformLocation(this.mShaderProgram, 'uUseLighting'),

                ambientColor: this.gl.getUniformLocation(this.mShaderProgram, 'uAmbientColor'),
                lightingDirection: this.gl.getUniformLocation(this.mShaderProgram, 'uLightingDirection'),
                directionalColor: this.gl.getUniformLocation(this.mShaderProgram, 'uDirectionalColor'),

                texture: this.gl.getUniformLocation(this.mShaderProgram, 'uTexture')
            }
        };
    }

    // endregion
    // -----------------------------------------------------------------------------------------------------------------



    // -----------------------------------------------------------------------------------------------------------------
    // region Loading

    async load(glbUrl) {

        // Fetch GLB file:
        const glb = await load(glbUrl, GLBLoader);

        // Parse meshes primitives:
        const primitives = [];
        for (let mesh of glb.json.meshes) {
            for (let primitiveDef of mesh.primitives) {
                const primitive = await this.loadPrimitive(glb, primitiveDef);
                if (primitive) {
                    primitives.push(primitive);
                }
            }
        }

        return new GLB(this.gl, this, primitives);
    }

    async loadPrimitive(glb, primitiveDef) {

        // Load data:
        const indices = GLBBuilder.getAccessorData(glb, primitiveDef.indices);
        const vertices = GLBBuilder.getAccessorData(glb, primitiveDef.attributes.POSITION);
        const normals = GLBBuilder.getAccessorData(glb, primitiveDef.attributes.NORMAL);
        const textureCoordinates = GLBBuilder.getAccessorData(glb, primitiveDef.attributes.TEXCOORD_0, true);

        if (!indices || !vertices || !normals || !textureCoordinates) return null;

        let texture;
        try {

            const materialDef = glb.json.materials[primitiveDef.material];

            const textureIndex = materialDef.pbrMetallicRoughness.baseColorTexture.index;
            texture = await GLBBuilder.getTexture(this.gl, glb, textureIndex);
        }
        catch (error) {
            console.warn(error);
            return null;
        }

        // Create buffers:
        const indicesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);

        const verticesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, verticesBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const normalsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, normals, this.gl.STATIC_DRAW);

        const textureCoordinatesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordinatesBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, textureCoordinates, this.gl.STATIC_DRAW);

        const buffers = {

            indices: {
                data: indicesBuffer,
                length: indices.length,
                dataType: GLBBuilder.getAccessorDataType(this.gl, glb, primitiveDef.indices),
                numberOfComponents: GLBBuilder.getAccessorNumberOfComponents(glb, primitiveDef.indices)
            },

            vertices: {
                data: verticesBuffer,
                length: vertices.length,
                dataType: GLBBuilder.getAccessorDataType(this.gl, glb, primitiveDef.attributes.POSITION),
                numberOfComponents: GLBBuilder.getAccessorNumberOfComponents(glb, primitiveDef.attributes.POSITION),
                stride: glb.json.bufferViews[glb.json.accessors[primitiveDef.attributes.POSITION].bufferView].byteStride || 0
            },

            normals: {
                data: normalsBuffer,
                length: normals.length,
                dataType: GLBBuilder.getAccessorDataType(this.gl, glb, primitiveDef.attributes.NORMAL),
                numberOfComponents: GLBBuilder.getAccessorNumberOfComponents(glb, primitiveDef.attributes.NORMAL),
                stride: glb.json.bufferViews[glb.json.accessors[primitiveDef.attributes.NORMAL].bufferView].byteStride || 0
            },

            textureCoordinates: textureCoordinatesBuffer === null ? null : {
                data: textureCoordinatesBuffer,
                length: textureCoordinates.length,
                dataType: GLBBuilder.getAccessorDataType(this.gl, glb, primitiveDef.attributes.TEXCOORD_0),
                numberOfComponents: GLBBuilder.getAccessorNumberOfComponents(glb, primitiveDef.attributes.TEXCOORD_0),
                stride: glb.json.bufferViews[glb.json.accessors[primitiveDef.attributes.TEXCOORD_0].bufferView].byteStride || 0
            }
        };

        return {
            buffers: buffers,
            texture: texture
        }
    }

    // endregion
    // -----------------------------------------------------------------------------------------------------------------



    // -----------------------------------------------------------------------------------------------------------------
    // region Getters

    getShaderProgram() { return this.mShaderProgram; }
    getShaderProgramInfo() { return this.mShaderProgramInfo; }

    // endregion
    // -----------------------------------------------------------------------------------------------------------------



    // -----------------------------------------------------------------------------------------------------------------
    // region Utils

    static async getTexture(gl, glb, textureIndex) {

        const textureDef = glb.json.textures[textureIndex];
        const samplerDef = glb.json.samplers[textureDef.sampler];
        const imageDef = glb.json.images[textureDef.source];
        const bufferViewDef = glb.json.bufferViews[imageDef.bufferView];
        const binChunk = glb.binChunks[0]; // TODO handle external uri

        const data = new Uint8Array(binChunk.arrayBuffer, binChunk.byteOffset + bufferViewDef.byteOffset, bufferViewDef.byteLength);
        const bitmap = await createImageBitmap(new Blob([data], { type: imageDef.mimeType } ));

        return Utils.loadTextureFromImageBitmap(
            gl,
            bitmap.width, bitmap.height,
            bitmap,
            GLBBuilder.getTextureWrap(gl, samplerDef.wrapS),
            GLBBuilder.getTextureWrap(gl, samplerDef.wrapS),
            GLBBuilder.getTextureMinFilter(gl, samplerDef.minFilter),
            GLBBuilder.getTextureMagFilter(gl, samplerDef.magFilter)
        );
    }

    static getTextureWrap(gl, id) {

        switch (id) {
            case 33071: return gl.CLAMP_TO_EDGE;
            case 33648: return gl.MIRRORED_REPEAT;
            default: case 10497: return gl.REPEAT;
        }
    }

    static getTextureMinFilter(gl, id) {

        switch (id) {
            case 9728: return gl.NEAREST;
            case 9729: return gl.LINEAR;
            case 9984: return gl.NEAREST_MIPMAP_NEAREST;
            case 9985: return gl.LINEAR_MIPMAP_NEAREST;
            default: case 9986: return gl.NEAREST_MIPMAP_LINEAR;
            case 9987: return gl.LINEAR_MIPMAP_LINEAR;
        }
    }

    static getTextureMagFilter(gl, id) {

        switch (id) {
            default: case 9728: return gl.NEAREST;
            case 9729: return gl.LINEAR;
        }
    }

    static getAccessorData(glb, accessorIndex, test = false) {

        const accessorDef = glb.json.accessors[accessorIndex];

        if (accessorDef) {

            const binChunk = glb.binChunks[0];

            const bufferViewDef = glb.json.bufferViews[accessorDef.bufferView];
            const componentType = accessorDef.componentType;
            const count = accessorDef.count;

            const byteOffset = binChunk.byteOffset + (accessorDef.byteOffset || 0) + bufferViewDef.byteOffset;

            let numberOfComponents = GLBBuilder.getAccessorNumberOfComponents(glb, accessorIndex);

            switch (componentType) {
                case 5120: { return new Int8Array(binChunk.arrayBuffer, byteOffset, count * numberOfComponents); }
                case 5121: { return new Uint8Array(binChunk.arrayBuffer, byteOffset, count * numberOfComponents); }
                case 5122: { return new Int16Array(binChunk.arrayBuffer, byteOffset, count * numberOfComponents); }
                case 5123: { return new Uint16Array(binChunk.arrayBuffer, byteOffset, count * numberOfComponents); }
                case 5125: { return new Uint32Array(binChunk.arrayBuffer, byteOffset, count * numberOfComponents); }
                case 5126: { return new Float32Array(binChunk.arrayBuffer, byteOffset, count * numberOfComponents); }
            }
        }

        return null;
    }

    static getAccessorNumberOfComponents(glb, accessorIndex) {

        const accessorDef = glb.json.accessors[accessorIndex];

        switch (accessorDef.type) {
            case "SCALAR": return 1;
            case "VEC2": return 2;
            case "VEC3": return 3;
            case "VEC4": return 4;
            case "MAT2": return 4;
            case "MAT3": return 9;
            case "MAT4": return 16;
        }

        return null;
    }

    static getAccessorDataType(gl, glb, accessorIndex) {

        const accessorDef = glb.json.accessors[accessorIndex];
        const componentType = accessorDef.componentType;

        switch (componentType) {
            case 5120: { return gl.BYTE; }
            case 5121: { return gl.UNSIGNED_BYTE; }
            case 5122: { return gl.SHORT; }
            case 5123: { return gl.UNSIGNED_SHORT; }
            case 5125: { return gl.UNSIGNED_INT; }
            case 5126: { return gl.FLOAT; }
        }
    }

    // endregion
    // -----------------------------------------------------------------------------------------------------------------
}
