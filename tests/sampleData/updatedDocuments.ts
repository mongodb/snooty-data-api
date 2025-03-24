import { ObjectId } from 'mongodb';

export const sampleUpdatedPageDocuments = [
  {
    _id: new ObjectId('646fa1958c4f35b1d3d83edf'),
    page_id: 'docs/docsworker-xlarge/master/data-center-awareness',
    filename: 'data-center-awareness.txt',
    ast: {
      foo: 'no assets',
    },
    static_assets: [],
    created_at: new Date('2023-04-06T13:25:40.000Z'),
    updated_at: new Date('2023-04-06T13:25:40.000Z'),
    deleted: false,
  },
  {
    _id: new ObjectId('646fa1958c4f35b1d3d83ee0'),
    page_id: 'docs/docsworker-xlarge/master/data-center-foo',
    filename: 'data-center-foo.txt',
    ast: {
      foo: 'deleted',
    },
    static_assets: [],
    created_at: new Date('2023-04-06T13:25:40.000Z'),
    updated_at: new Date('2023-04-06T14:25:40.000Z'),
    deleted: true,
  },
  {
    _id: new ObjectId('646fa1958c4f35b1d3d83ee1'),
    page_id: 'docs/docsworker-xlarge/master/tutorial/insert-documents',
    filename: 'tutorial/insert-documents.txt',
    ast: {
      foo: '1 asset example',
    },
    static_assets: [
      {
        checksum: 'd4dbe419766d19842ba5624cb41f6b873a513b620049e759a923894bef17742c',
        key: '/images/CSFLE_Master_Key_KMS.png',
        updated_at: new Date('2023-04-06T14:25:40.000Z'),
      },
      {
        checksum: 'ba1b4507fc789827edd02f979130e9633a0020b498cba915c0773403b37aedd5',
        key: '/images/compass-update-doc-button.png',
        // Not updated
        updated_at: new Date('2023-04-06T13:25:40.000Z'),
      },
    ],
    created_at: new Date('2023-04-06T13:25:40.000Z'),
    updated_at: new Date('2023-04-06T14:25:40.000Z'),
    deleted: false,
  },
  {
    _id: new ObjectId('646fa1958c4f35b1d3d83ee2'),
    page_id: 'docs/docsworker-xlarge/master/tutorial/update-documents',
    filename: 'tutorial/update-documents.txt',
    ast: {
      foo: 'no updates',
    },
    static_assets: [
      {
        checksum: 'ba1b4507fc789827edd02f979130e9633a0020b498cba915c0773403b37aedd5',
        key: '/images/compass-update-doc-button.png',
        updated_at: new Date('2023-04-06T13:25:40.000Z'),
      },
      {
        checksum: '9617b2e1a8065e4a1699c15fc8ea1e085a41b4021debeaef1793a6cb431a9659',
        key: '/images/compass-update-edit-mode.png',
        updated_at: new Date('2023-04-06T13:25:40.000Z'),
      },
    ],
    created_at: new Date('2023-04-06T13:25:40.000Z'),
    updated_at: new Date('2023-04-06T13:25:40.000Z'),
    deleted: false,
  },
  {
    _id: new ObjectId('646fa1958c4f35b1d3d83ee3'),
    page_id: 'irrelevant-docs/docsworker-xlarge/master/tutorial/update-documents',
    filename: 'tutorial/update-documents.txt',
    ast: {},
    static_assets: [],
    created_at: new Date('2023-04-06T13:25:40.000Z'),
    updated_at: new Date('2023-04-06T13:25:40.000Z'),
    deleted: false,
  },
  {
    _id: new ObjectId('646fa1958c4f35b1d3d83ee4'),
    page_id: 'docs/docsworker-xlarge/not-master/tutorial/update-documents',
    filename: 'tutorial/update-documents.txt',
    ast: {},
    static_assets: [],
    created_at: new Date('2023-04-06T13:25:40.000Z'),
    updated_at: new Date('2023-04-06T13:25:40.000Z'),
    deleted: false,
  },
  {
    _id: new ObjectId('646fa1958c4f35b1d3d83ee5'),
    page_id: 'landing/docsworker-xlarge/updated-when-deleted/index',
    filename: 'index.txt',
    ast: {},
    source: 'wahoo',
    static_assets: [],
    created_at: new Date('2023-04-03T13:26:40.000Z'),
    deleted: true,
    updated_at: new Date('2023-04-06T15:25:40.000Z'),
  },
];
