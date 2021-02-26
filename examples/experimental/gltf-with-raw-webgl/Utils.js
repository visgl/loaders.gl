
class Utils {

    static isPowerOf2(value) {
        return (value & (value - 1)) == 0;
    }

    static toRadian(a) {
        return a * Utils.DEGREE;
    }

    static toDegree(a) {
        return a * Utils.RADIAN;
    }

    static getDevicePixelRatio() {
        return window.devicePixelRatio || 1;
    }

    static loadTextureFromImageBitmap(gl, width, height, imageBitmap, wrapS = gl.CLAMP_TO_EDGE, wrapT = gl.CLAMP_TO_EDGE, minFilter = gl.NEAREST_MIPMAP_LINEAR, magFilter = gl.LINEAR) {

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageBitmap);

        if (Utils.isPowerOf2(width) && Utils.isPowerOf2(height)) {
            switch (minFilter) {
                case gl.NEAREST_MIPMAP_NEAREST:
                case gl.NEAREST_MIPMAP_LINEAR:
                case gl.LINEAR_MIPMAP_NEAREST:
                case gl.LINEAR_MIPMAP_LINEAR: {
                    gl.generateMipmap(gl.TEXTURE_2D);
                    break;
                }
            }
        }

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);

        return texture;
    }

    static initShaderProgram(gl, vsSource, fsSource) {

        const vertexShader = Utils.loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = Utils.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        // Create the shader program
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    }

    static loadShader(gl, type, source) {

        const shader = gl.createShader(type);

        // Send the source to the shader object
        gl.shaderSource(shader, source);

        // Compile the shader program
        gl.compileShader(shader);

        // See if it compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

}

Utils.DEGREE = Math.PI / 180;
Utils.RADIAN = 180 / Math.PI;
