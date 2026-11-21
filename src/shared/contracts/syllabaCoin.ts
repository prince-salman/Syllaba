export const OFFICIAL_SYLLABA_COIN_ADDRESS: `0x${string}` =
  "0xd5209dc2129c3fb05eadeb82589ff465ddf504af";

export const OFFICIAL_SYLLABA_COIN_OWNER: `0x${string}` =
  "0x23eC82058985E357FB95B5D356793DE51138B7f5";

export const OFFICIAL_SYL_MODULE_REWARD = 0.25;

export const SYLLABA_COIN_ADDRESS: `0x${string}` =
  (process.env.NEXT_PUBLIC_SYLLABA_COIN_ADDRESS as `0x${string}` | undefined) ||
  OFFICIAL_SYLLABA_COIN_ADDRESS;

export const SYLLABA_COIN_BYTECODE: `0x${string}` =
  "0x60c0604052348015600e575f5ffd5b5033608081905260a0819052683635c9adc5dea000005f818155828152600160209081526040808320849055518381529293927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35060805160a0516110566100955f395f818161026a015261041f01525f6102e701526110565ff3fe608060405234801561000f575f5ffd5b5060043610610111575f3560e01c806370a082311161009e578063a9059cbb1161006e578063a9059cbb146102c6578063bf3c6e35146102d9578063d5f39488146102e2578063dc51fab414610309578063dd62ed3e1461031c575f5ffd5b806370a082311461020557806373aca9f41461022d5780638da5cb5b1461026557806395d89b41146102a4575f5ffd5b806323b872dd116100e457806323b872dd146101a4578063313ce567146101b757806332cb6b0c146101d157806339844eab146101e35780633a0d0a93146101f6575f5ffd5b806306fdde0314610115578063095ea7b31461015657806318160ddd146101795780631cbe08601461018f575b5f5ffd5b6101406040518060400160405280600c81526020016b29bcb63630b1309021b7b4b760a11b81525081565b60405161014d9190610c88565b60405180910390f35b610169610164366004610cd8565b610354565b604051901515815260200161014d565b6101815f5481565b60405190815260200161014d565b6101a261019d366004610d00565b610414565b005b6101696101b2366004610d20565b610680565b6101bf601281565b60405160ff909116815260200161014d565b6101816a52b7d2dcc80cd2e400000081565b6101816101f1366004610d9f565b610768565b6101816703782dace9d9000081565b610181610213366004610d00565b6001600160a01b03165f9081526001602052604090205490565b61016961023b366004610cd8565b6001600160a01b03919091165f908152600360209081526040808320938352929052205460ff1690565b61028c7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b03909116815260200161014d565b6101406040518060400160405280600381526020016214d65360ea1b81525081565b6101696102d4366004610cd8565b6109c0565b61018161138881565b61028c7f000000000000000000000000000000000000000000000000000000000000000081565b610169610317366004610dee565b6109d5565b61018161032a366004610e36565b6001600160a01b039182165f90815260026020908152604080832093909416825291909152205490565b5f6001600160a01b0383166103b05760405162461bcd60e51b815260206004820152601c60248201527f53594c3a20617070726f766520746f207a65726f20616464726573730000000060448201526064015b60405180910390fd5b335f8181526002602090815260408083206001600160a01b03881680855290835292819020869055518581529192917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a35060015b92915050565b336001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000161461047e5760405162461bcd60e51b815260206004820152600f60248201526e29aca61d1037b7363c9037bbb732b960891b60448201526064016103a7565b6001600160a01b0381166104c85760405162461bcd60e51b815260206004820152601160248201527014d6530e881e995c9bc81cdd1d59195b9d607a1b60448201526064016103a7565b6a52b7d2dcc80cd2e40000006703782dace9d900005f546104e99190610e7b565b11156105325760405162461bcd60e51b815260206004820152601860248201527714d6530e881b585e081cdd5c1c1b1e48195e18d95959195960421b60448201526064016103a7565b6703782dace9d900005f5f82825461054a9190610e7b565b90915550506001600160a01b0381165f90815260016020526040812080546703782dace9d90000929061057e908490610e7b565b90915550506040516703782dace9d9000081526001600160a01b038216905f905f5160206110015f395f51905f529060200160405180910390a35f546040516bffffffffffffffffffffffff19606084901b166020820152436034820152605481019190915260740160405160208183030381529060405280519060200120816001600160a01b03167f2b2ac79b80f7aedf1fcdb63226b783689459c8fa6d6e95d4ae406c04d5116f7f6703782dace9d90000604051610675918152604060208201819052601a908201527f4d4f44554c455f47524144554154494f4e5f305f32355f53594c000000000000606082015260800190565b60405180910390a350565b6001600160a01b0383165f908152600260209081526040808320338452909152812054828110156106f35760405162461bcd60e51b815260206004820152601b60248201527f53594c3a20696e73756666696369656e7420616c6c6f77616e6365000000000060448201526064016103a7565b6001600160a01b0385165f81815260026020908152604080832033808552908352928190208786039081905590519081529192917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a361075d858585610b2b565b506001949350505050565b5f846107ad5760405162461bcd60e51b815260206004820152601460248201527314d6530e881a5b9d985b1a590818db185a5b525960621b60448201526064016103a7565b5f841180156107be57506113888411155b61080a5760405162461bcd60e51b815260206004820152601760248201527f53594c3a20636c61696d206f7574206f662072616e676500000000000000000060448201526064016103a7565b335f90815260036020908152604080832088845290915290205460ff16156108745760405162461bcd60e51b815260206004820152601b60248201527f53594c3a2072657761726420616c726561647920636c61696d6564000000000060448201526064016103a7565b5f6108816012600a610f71565b61088b9086610f7c565b90506a52b7d2dcc80cd2e4000000815f546108a69190610e7b565b11156108ef5760405162461bcd60e51b815260206004820152601860248201527714d6530e881b585e081cdd5c1c1b1e48195e18d95959195960421b60448201526064016103a7565b335f9081526003602090815260408083208984529091528120805460ff1916600117905580548291908190610925908490610e7b565b9091555050335f9081526001602052604081208054839290610948908490610e7b565b909155505060405181815233905f905f5160206110015f395f51905f529060200160405180910390a385336001600160a01b03167f2b2ac79b80f7aedf1fcdb63226b783689459c8fa6d6e95d4ae406c04d5116f7f8387876040516109af93929190610fbb565b60405180910390a395945050505050565b5f6109cc338484610b2b565b50600192915050565b5f5f8211610a255760405162461bcd60e51b815260206004820152601c60248201527f53594c3a20616d6f756e74206d75737420626520706f7369746976650000000060448201526064016103a7565b5f610a326012600a610f71565b610a3c9084610f7c565b335f90815260016020526040902054909150811115610a9d5760405162461bcd60e51b815260206004820152601d60248201527f53594c3a20696e73756666696369656e742053594c2062616c616e636500000060448201526064016103a7565b335f8181526001602090815260408083208054869003905582548590038355518481529192915f5160206110015f395f51905f52910160405180910390a3336001600160a01b03167f2f00057cca861ce8f594de693c8f5be27410d9acb676bb0153f8bbeead7b613a868684604051610b1893929190610fdd565b60405180910390a2506001949350505050565b6001600160a01b038316610b815760405162461bcd60e51b815260206004820152601760248201527f53594c3a207472616e736665722066726f6d207a65726f00000000000000000060448201526064016103a7565b6001600160a01b038216610bcf5760405162461bcd60e51b815260206004820152601560248201527453594c3a207472616e7366657220746f207a65726f60581b60448201526064016103a7565b6001600160a01b0383165f90815260016020526040902054811115610c2d5760405162461bcd60e51b815260206004820152601460248201527353594c3a2062616c616e636520746f6f206c6f7760601b60448201526064016103a7565b6001600160a01b038084165f81815260016020526040808220805486900390559285168082529083902080548501905591515f5160206110015f395f51905f5290610c7b9085815260200190565b60405180910390a3505050565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b80356001600160a01b0381168114610cd3575f5ffd5b919050565b5f5f60408385031215610ce9575f5ffd5b610cf283610cbd565b946020939093013593505050565b5f60208284031215610d10575f5ffd5b610d1982610cbd565b9392505050565b5f5f5f60608486031215610d32575f5ffd5b610d3b84610cbd565b9250610d4960208501610cbd565b929592945050506040919091013590565b5f5f83601f840112610d6a575f5ffd5b50813567ffffffffffffffff811115610d81575f5ffd5b602083019150836020828501011115610d98575f5ffd5b9250929050565b5f5f5f5f60608587031215610db2575f5ffd5b8435935060208501359250604085013567ffffffffffffffff811115610dd6575f5ffd5b610de287828801610d5a565b95989497509550505050565b5f5f5f60408486031215610e00575f5ffd5b833567ffffffffffffffff811115610e16575f5ffd5b610e2286828701610d5a565b909790965060209590950135949350505050565b5f5f60408385031215610e47575f5ffd5b610e5083610cbd565b9150610e5e60208401610cbd565b90509250929050565b634e487b7160e01b5f52601160045260245ffd5b8082018082111561040e5761040e610e67565b6001815b6001841115610ec957808504811115610ead57610ead610e67565b6001841615610ebb57908102905b60019390931c928002610e92565b935093915050565b5f82610edf5750600161040e565b81610eeb57505f61040e565b8160018114610f015760028114610f0b57610f27565b600191505061040e565b60ff841115610f1c57610f1c610e67565b50506001821b61040e565b5060208310610133831016604e8410600b8410161715610f4a575081810a61040e565b610f565f198484610e8e565b805f1904821115610f6957610f69610e67565b029392505050565b5f610d198383610ed1565b808202811582820484141761040e5761040e610e67565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b838152604060208201525f610fd4604083018486610f93565b95945050505050565b604081525f610ff0604083018587610f93565b905082602083015294935050505056feddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa2646970667358221220e6f0e5701c6228e849adb316ed98b0dd6d30dc28624d4d4f0b2ac409aca31c6164736f6c63430008270033";

export const SYLLABA_COIN_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "perkId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "burnedWei",
        "type": "uint256"
      }
    ],
    "name": "PerkRedeemed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "claimId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "courseRef",
        "type": "string"
      }
    ],
    "name": "StudyRewardMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_SINGLE_CLAIM",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SUPPLY",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MODULE_REWARD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenOwner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "claimId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "wholeTokens",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "courseRef",
        "type": "string"
      }
    ],
    "name": "claimStudyReward",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deployer",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "claimId",
        "type": "bytes32"
      }
    ],
    "name": "isRewardClaimed",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "perkId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "wholeTokens",
        "type": "uint256"
      }
    ],
    "name": "redeemPerk",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      }
    ],
    "name": "rewardCompletedModule",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
