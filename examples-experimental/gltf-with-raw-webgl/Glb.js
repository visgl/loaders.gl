
class GLB {

    gl = null;
    mBuilder = null;
    mPrimitives = null;

    mNormalMatrix = mat3.create();

    mAmbientColor =         [  0.6,  0.6,  0.6 ];
    mLightingDirection =    [ -1.0, -1.0, -1.0 ];
    mDirectionalColor =     [  0.5,  0.5,  0.5 ];

    constructor(gl, builder, primitives) {

        this.gl = gl;
        this.mBuilder = builder;
        this.mPrimitives = primitives;
    }

    draw(projectionMatrix, modelViewMatrix, drawingMode = this.gl.TRIANGLES, isLightningEnabled = true) {

        if (this.mPrimitives === null) {
            return;
        }

        // Use the program:
        this.gl.useProgram(this.mBuilder.getShaderProgram());

        this.gl.enableVertexAttribArray(this.mBuilder.getShaderProgramInfo().uniformLocations.projectionMatrix);
        this.gl.uniformMatrix4fv(this.mBuilder.getShaderProgramInfo().uniformLocations.projectionMatrix, false, projectionMatrix);

        this.gl.enableVertexAttribArray(this.mBuilder.getShaderProgramInfo().uniformLocations.modelViewMatrix);
        this.gl.uniformMatrix4fv(this.mBuilder.getShaderProgramInfo().uniformLocations.modelViewMatrix, false, modelViewMatrix);

        mat3.identity(this.mNormalMatrix);
        mat3.fromMat4(this.mNormalMatrix, modelViewMatrix);
        mat3.invert(this.mNormalMatrix, this.mNormalMatrix);
        mat3.transpose(this.mNormalMatrix, this.mNormalMatrix);

        this.gl.uniformMatrix3fv(this.mBuilder.getShaderProgramInfo().uniformLocations.normalMatrix, false, this.mNormalMatrix);

        // Set lighting enabled:
        this.gl.uniform1i(this.mBuilder.getShaderProgramInfo().uniformLocations.useLightning, isLightningEnabled);

        // If we are using lighting:
        if (isLightningEnabled) {

            // Set the lighting direction:
            var adjustedLightingDirection = vec3.create();
            vec3.normalize(adjustedLightingDirection, this.mLightingDirection);
            vec3.scale(adjustedLightingDirection, adjustedLightingDirection, -1);
            this.gl.uniform3fv(this.mBuilder.getShaderProgramInfo().uniformLocations.lightingDirection, adjustedLightingDirection);

            // Set the lighting colors (ambient & directional):
            this.gl.uniform3fv(this.mBuilder.getShaderProgramInfo().uniformLocations.ambientColor, this.mAmbientColor);
            this.gl.uniform3fv(this.mBuilder.getShaderProgramInfo().uniformLocations.directionalColor, this.mDirectionalColor);
        }

        for (let primitive of this.mPrimitives) {

            // Bind vertices:
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, primitive.buffers.vertices.data);
            this.gl.vertexAttribPointer(this.mBuilder.getShaderProgramInfo().attribLocations.vertexPosition, primitive.buffers.vertices.numberOfComponents, this.gl.FLOAT, false, primitive.buffers.vertices.stride, 0);
            this.gl.enableVertexAttribArray(this.mBuilder.getShaderProgramInfo().attribLocations.vertexPosition);

            // Bind normals:
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, primitive.buffers.normals.data);
            this.gl.vertexAttribPointer(this.mBuilder.getShaderProgramInfo().attribLocations.vertexNormal, primitive.buffers.normals.numberOfComponents, this.gl.FLOAT, false, primitive.buffers.normals.stride, 0);
            this.gl.enableVertexAttribArray(this.mBuilder.getShaderProgramInfo().attribLocations.vertexNormal);

            // Bind texture:
            if (primitive.texture) {

                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, primitive.texture);
                this.gl.uniform1i(this.mBuilder.getShaderProgramInfo().uniformLocations.texture, 0);

                // Bind texture coordinates:
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, primitive.buffers.textureCoordinates.data);
                this.gl.vertexAttribPointer(this.mBuilder.getShaderProgramInfo().attribLocations.vertexTextureCoordinate, primitive.buffers.textureCoordinates.numberOfComponents, this.gl.FLOAT, false, primitive.buffers.textureCoordinates.stride, 0);
                this.gl.enableVertexAttribArray(this.mBuilder.getShaderProgramInfo().attribLocations.vertexTextureCoordinate);
            }

            // Draw:
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, primitive.buffers.indices.data);
            this.gl.drawElements(drawingMode, primitive.buffers.indices.length, primitive.buffers.indices.dataType, 0);
        }
    }
}
