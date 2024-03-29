import { ObjectId } from 'mongodb';

export const samplePageDocuments = [
  {
    _id: new ObjectId('646e8ab3806cedd1747f0591'),
    page_id: 'docs/docsworker-xlarge/master/data-center-awareness',
    filename: 'data-center-awareness.txt',
    ast: {},
    source: 'no asset example',
    static_assets: [],
    build_id: new ObjectId('642ec854c38bedd45ed3d1fc'),
    created_at: new Date('2023-04-06T13:25:40.000Z'),
    github_username: 'babadook',
  },
  {
    _id: new ObjectId('646e8ab3806cedd1747f0592'),
    page_id: 'docs/docsworker-xlarge/master/tutorial/insert-documents',
    filename: 'tutorial/insert-documents.txt',
    ast: {},
    source: '1 asset example',
    static_assets: [
      {
        checksum: 'd4dbe419766d19842ba5624cb41f6b873a513b620049e759a923894bef17742c',
        key: '/images/CSFLE_Master_Key_KMS.png',
      },
    ],
    build_id: new ObjectId('642ec854c38bedd45ed3d1fc'),
    created_at: new Date('2023-04-06T13:25:40.000Z'),
    github_username: 'babadook',
  },
  {
    _id: new ObjectId('646e8ab3806cedd1747f0593'),
    page_id: 'docs/docsworker-xlarge/master/tutorial/update-documents',
    filename: 'tutorial/update-documents.txt',
    ast: {},
    source: '2 assets example',
    static_assets: [
      {
        checksum: 'ba1b4507fc789827edd02f979130e9633a0020b498cba915c0773403b37aedd5',
        key: '/images/compass-update-doc-button.png',
      },
      {
        checksum: '9617b2e1a8065e4a1699c15fc8ea1e085a41b4021debeaef1793a6cb431a9659',
        key: '/images/compass-update-edit-mode.png',
      },
    ],
    build_id: new ObjectId('642ec854c38bedd45ed3d1fc'),
    created_at: new Date('2023-04-06T13:25:40.000Z'),
    github_username: 'babadook',
  },
  {
    _id: new ObjectId('646e8ab3806cedd1747f0594'),
    page_id: 'docs/docsworker-xlarge/master/data-center-awareness',
    filename: 'data-center-awareness.txt',
    ast: {},
    source: 'irrelevant docs build with different build id',
    static_assets: [],
    build_id: new ObjectId('642ec858c38bedd45ed3dd54'),
    created_at: new Date('2023-04-06T13:25:40.000Z'),
    github_username: 'docs-builder-bot',
  },
];
