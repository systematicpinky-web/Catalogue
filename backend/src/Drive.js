// Image storage in Drive. thumbnail?id=... is used for imageUrl rather than uc?export=view,
// which is prone to virus-scan interstitials/download prompts instead of raw image bytes.

function saveImage_(productId, base64, mimeType) {
  var folder = DriveApp.getFolderById(getImageFolderId_());
  var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, productId + '-' + Date.now());
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var id = file.getId();
  return { imageId: id, imageUrl: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1000' };
}

function deleteImageIfPresent_(imageId) {
  if (!imageId) return;
  try {
    DriveApp.getFileById(imageId).setTrashed(true);
  } catch (e) {
    // File already gone/inaccessible — nothing further to do.
  }
}
