// Custom CapsuleGeometry implementation
// This is needed because THREE.CapsuleGeometry is not working correctly in the current Three.js version

// Create a custom capsule geometry by combining a cylinder and two hemispheres
class CustomCapsuleGeometry extends THREE.BufferGeometry {
  // Check if THREE is defined before proceeding
  static isThreeLoaded() {
    return typeof THREE !== "undefined";
  }
  constructor(
    radius = 1,
    height = 2,
    radiusSegments = 8,
    heightSegments = 1,
    capSegments = 8,
    thetaStart = 0,
    thetaLength = Math.PI * 2
  ) {
    super();

    // Check if THREE is properly loaded
    if (typeof THREE === "undefined") {
      console.error(
        "THREE is not defined. Cannot create CustomCapsuleGeometry."
      );
      return;
    }

    this.type = "CustomCapsuleGeometry";

    // Parameters
    this.parameters = {
      radius: radius,
      height: height,
      radiusSegments: radiusSegments,
      heightSegments: heightSegments,
      capSegments: capSegments,
      thetaStart: thetaStart,
      thetaLength: thetaLength,
    };

    // Create the geometry by combining a cylinder and two spheres
    const cylinderHeight = height - 2 * radius;
    const halfHeight = cylinderHeight / 2;

    // Create cylinder for the middle part
    const cylinderGeometry = new THREE.CylinderGeometry(
      radius,
      radius,
      cylinderHeight,
      radiusSegments,
      heightSegments,
      false
    );

    // Create spheres for the caps
    const sphereGeometry1 = new THREE.SphereGeometry(
      radius,
      radiusSegments,
      capSegments,
      thetaStart,
      thetaLength,
      0,
      Math.PI / 2
    );
    const sphereGeometry2 = new THREE.SphereGeometry(
      radius,
      radiusSegments,
      capSegments,
      thetaStart,
      thetaLength,
      Math.PI / 2,
      Math.PI / 2
    );

    // Position the geometries
    const matrix = new THREE.Matrix4();

    // Translate the cylinder to the center
    matrix.makeTranslation(0, 0, 0);
    this.merge(cylinderGeometry, matrix);

    // Translate the top sphere
    matrix.makeTranslation(0, halfHeight, 0);
    this.merge(sphereGeometry1, matrix);

    // Translate the bottom sphere
    matrix.makeTranslation(0, -halfHeight, 0);
    this.merge(sphereGeometry2, matrix);

    // Generate normals
    this.computeVertexNormals();
  }

  // Helper method to merge buffer geometries
  merge(geometry, matrix) {
    const position = this.attributes.position;
    const normal = this.attributes.normal;
    const uv = this.attributes.uv;

    if (!position) {
      // If this is the first geometry, just copy its attributes
      this.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(geometry.attributes.position.array, 3)
      );
      this.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(geometry.attributes.normal.array, 3)
      );
      if (geometry.attributes.uv) {
        this.setAttribute(
          "uv",
          new THREE.Float32BufferAttribute(geometry.attributes.uv.array, 2)
        );
      }
      this.setIndex(geometry.index ? geometry.index.array : null);
      return;
    }

    // Otherwise, append the new geometry's attributes
    const positions = Array.from(position.array);
    const normals = Array.from(normal.array);
    const uvs = uv ? Array.from(uv.array) : [];

    const geoPositions = geometry.attributes.position.array;
    const geoNormals = geometry.attributes.normal.array;
    const geoUvs = geometry.attributes.uv ? geometry.attributes.uv.array : [];

    // Apply matrix transformation to positions and normals
    for (let i = 0; i < geoPositions.length; i += 3) {
      const vector = new THREE.Vector3(
        geoPositions[i],
        geoPositions[i + 1],
        geoPositions[i + 2]
      );

      vector.applyMatrix4(matrix);

      positions.push(vector.x, vector.y, vector.z);
    }

    // Apply rotation part of matrix to normals
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);

    for (let i = 0; i < geoNormals.length; i += 3) {
      const vector = new THREE.Vector3(
        geoNormals[i],
        geoNormals[i + 1],
        geoNormals[i + 2]
      );

      vector.applyMatrix3(normalMatrix);

      normals.push(vector.x, vector.y, vector.z);
    }

    // Copy UVs if they exist
    if (geoUvs.length > 0) {
      for (let i = 0; i < geoUvs.length; i++) {
        uvs.push(geoUvs[i]);
      }
    }

    // Update attributes
    this.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    this.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    if (uvs.length > 0) {
      this.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    }

    // Merge indices if they exist
    if (geometry.index) {
      const indices = this.index ? Array.from(this.index.array) : [];
      const offset = positions.length / 3 - geoPositions.length / 3;

      for (let i = 0; i < geometry.index.array.length; i++) {
        indices.push(geometry.index.array[i] + offset);
      }

      this.setIndex(indices);
    }
  }
}

// Add to THREE namespace
if (typeof THREE !== "undefined") {
  THREE.CustomCapsuleGeometry = CustomCapsuleGeometry;
} else {
  console.error("THREE is not defined. Cannot register CustomCapsuleGeometry.");
}
