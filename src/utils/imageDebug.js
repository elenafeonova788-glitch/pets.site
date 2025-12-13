// utils/imageDebug.js
export const debugImagePaths = (pet) => {
    console.group('Image Debug for Pet:');
    console.log('Pet ID:', pet.id);
    console.log('Pet Type:', pet.type);
    console.log('Pet Object:', pet);
    
    if (pet.photos) {
      console.log('Photos array:', pet.photos);
      pet.photos.forEach((photo, index) => {
        console.log(`Photo ${index}:`, photo);
      });
    }
    
    if (pet.image) {
      console.log('Image field:', pet.image);
    }
    
    if (pet.photo1) console.log('Photo1:', pet.photo1);
    if (pet.photo2) console.log('Photo2:', pet.photo2);
    if (pet.photo3) console.log('Photo3:', pet.photo3);
    
    if (pet.originalData) {
      console.log('Original Data:', pet.originalData);
    }
    
    console.groupEnd();
  };