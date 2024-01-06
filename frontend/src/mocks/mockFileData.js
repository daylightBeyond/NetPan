let cover = null;
async function getCover() {
  const res = await import('./mockImage/mockImage1_.jpg');
  return res.default;
}

import('./mockImage/mockImage1_.jpg').then(res => {
  cover = res.default;
})

const mockFileData = [
  {
    "fileId": "ETmADgY93C",
    "filePid": "0",
    "fileSize": 611252,
    "fileName": "51144542_p0_master1200_zvRj2.jpg",
    // "fileCover": async () => {const res = await import('./mockImage/mockImage1_.jpg'); return res.default},
    "fileCover": 'http://localhost:3002/8cb3e0ce38bf1bc8add9.jpg',
    "lastUpdateTime": "2023-12-30 18:24:31",
    "folderType": 0,
    "fileCategory": 3,
    "fileType": 3,
    "status": 2
  },
  {
    "fileId": "syhqbwKoah",
    "filePid": "0",
    "fileSize": 611252,
    "fileName": "mockImage1.jpg",
    "fileCover": cover,
    "lastUpdateTime": "2023-12-21 22:06:25",
    "folderType": 0,
    "fileCategory": 3,
    "fileType": 3,
    "status": 2
  }
]
export default mockFileData;
