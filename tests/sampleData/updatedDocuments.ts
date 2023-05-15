export const sampleUpdatedPageDocuments = [
  {
    page_id: "docs/docsworker-xlarge/master/data-center-awareness",
    filename: "data-center-awareness.txt",
    ast: {
      foo: "no assets"
    },
    static_assets: [],
    created_at: new Date("2023-04-06T13:25:40.000Z"),
    updated_at: new Date ("2023-04-06T13:25:40.000Z"),
    deleted: false,
  },
  {
    page_id: "docs/docsworker-xlarge/master/data-center-foo",
    filename: "data-center-foo.txt",
    ast: {
      foo: "deleted"
    },
    static_assets: [],
    created_at: new Date("2023-04-06T13:25:40.000Z"),
    updated_at: new Date("2023-04-06T14:25:40.000Z"),
    deleted: true,
  },
  {
    page_id: "docs/docsworker-xlarge/master/tutorial/insert-documents",
    filename: "tutorial/insert-documents.txt",
    ast: {
      foo: "1 asset example"
    },
    static_assets: [
      {
        checksum: "d4dbe419766d19842ba5624cb41f6b873a513b620049e759a923894bef17742c",
        key: "/images/CSFLE_Master_Key_KMS.png"
      }
    ],
    created_at: new Date("2023-04-06T13:25:40.000Z"),
    updated_at: new Date("2023-04-06T14:25:40.000Z"),
    deleted: false,
  },
  {
    page_id: "docs/docsworker-xlarge/master/tutorial/update-documents",
    filename: "tutorial/update-documents.txt",
    ast: {},
    static_assets: [
      {
        checksum: "ba1b4507fc789827edd02f979130e9633a0020b498cba915c0773403b37aedd5",
        key: "/images/compass-update-doc-button.png"
      },
      {
        checksum: "9617b2e1a8065e4a1699c15fc8ea1e085a41b4021debeaef1793a6cb431a9659",
        key: "/images/compass-update-edit-mode.png"
      }
    ],
    created_at: new Date("2023-04-06T13:25:40.000Z"),
    updated_at: new Date("2023-04-06T13:25:40.000Z"),
    deleted: false,
  },
  {
    page_id: "not-docs/docsworker-xlarge/master/tutorial/update-documents",
    filename: "tutorial/update-documents.txt",
    ast: {},
    static_assets: [],
    created_at: new Date("2023-04-06T13:25:40.000Z"),
    updated_at: new Date("2023-04-06T13:25:40.000Z"),
    deleted: false,
  },
  {
    page_id: "docs/docsworker-xlarge/not-master/tutorial/update-documents",
    filename: "tutorial/update-documents.txt",
    ast: {},
    static_assets: [],
    created_at: new Date("2023-04-06T13:25:40.000Z"),
    updated_at: new Date("2023-04-06T13:25:40.000Z"),
    deleted: false,
  }
];
