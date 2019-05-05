export default function isGeometry(geometry) {
  return (
    geometry &&
    typeof geometry === 'object' &&
    geometry.mode &&
    geometry.attributes &&
    typeof geometry.attributes === 'object'
  );
}
