export const SYLLABA_COIN_ADDRESS =
  (process.env.NEXT_PUBLIC_SYLLABA_COIN_ADDRESS as `0x${string}` | undefined) || undefined;

export const SYLLABA_COIN_BYTECODE: `0x${string}` =
  "0x60a0604052348015600e575f5ffd5b50336080819052683635c9adc5dea000005f818155828152600160209081526040808320849055518381529293927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a350608051610d9c6100805f395f6102630152610d9c5ff3fe608060405234801561000f575f5ffd5b50600436106100f0575f3560e01c806370a0823111610093578063bf3c6e3511610063578063bf3c6e3514610255578063d5f394881461025e578063dc51fab41461029d578063dd62ed3e146102b0575f5ffd5b806370a08231146101c057806373aca9f4146101e857806395d89b4114610220578063a9059cbb14610242575f5ffd5b806323b872dd116100ce57806323b872dd1461016e578063313ce5671461018157806332cb6b0c1461019b57806339844eab146101ad575f5ffd5b806306fdde03146100f4578063095ea7b31461013557806318160ddd14610158575b5f5ffd5b61011f6040518060400160405280600c81526020016b29bcb63630b1309021b7b4b760a11b81525081565b60405161012c91906109ee565b60405180910390f35b610148610143366004610a3e565b6102e8565b604051901515815260200161012c565b6101605f5481565b60405190815260200161012c565b61014861017c366004610a66565b6103a8565b610189601281565b60405160ff909116815260200161012c565b6101606a52b7d2dcc80cd2e400000081565b6101606101bb366004610ae5565b610490565b6101606101ce366004610b34565b6001600160a01b03165f9081526001602052604090205490565b6101486101f6366004610a3e565b6001600160a01b03919091165f908152600360209081526040808320938352929052205460ff1690565b61011f6040518060400160405280600381526020016214d65360ea1b81525081565b610148610250366004610a3e565b610700565b61016061138881565b6102857f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b03909116815260200161012c565b6101486102ab366004610b54565b610715565b6101606102be366004610b9c565b6001600160a01b039182165f90815260026020908152604080832093909416825291909152205490565b5f6001600160a01b0383166103445760405162461bcd60e51b815260206004820152601c60248201527f53594c3a20617070726f766520746f207a65726f20616464726573730000000060448201526064015b60405180910390fd5b335f8181526002602090815260408083206001600160a01b03881680855290835292819020869055518581529192917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a35060015b92915050565b6001600160a01b0383165f9081526002602090815260408083203384529091528120548281101561041b5760405162461bcd60e51b815260206004820152601b60248201527f53594c3a20696e73756666696369656e7420616c6c6f77616e63650000000000604482015260640161033b565b6001600160a01b0385165f81815260026020908152604080832033808552908352928190208786039081905590519081529192917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a361048585858561087e565b506001949350505050565b5f846104d55760405162461bcd60e51b815260206004820152601460248201527314d6530e881a5b9d985b1a590818db185a5b525960621b604482015260640161033b565b5f841180156104e657506113888411155b6105325760405162461bcd60e51b815260206004820152601760248201527f53594c3a20636c61696d206f7574206f662072616e6765000000000000000000604482015260640161033b565b335f90815260036020908152604080832088845290915290205460ff161561059c5760405162461bcd60e51b815260206004820152601b60248201527f53594c3a2072657761726420616c726561647920636c61696d65640000000000604482015260640161033b565b5f6105a96012600a610cc4565b6105b39086610ccf565b90506a52b7d2dcc80cd2e4000000815f546105ce9190610ce6565b111561061c5760405162461bcd60e51b815260206004820152601860248201527f53594c3a206d617820737570706c792065786365656465640000000000000000604482015260640161033b565b335f9081526003602090815260408083208984529091528120805460ff1916600117905580548291908190610652908490610ce6565b9091555050335f9081526001602052604081208054839290610675908490610ce6565b909155505060405181815233905f907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a385336001600160a01b03167f2b2ac79b80f7aedf1fcdb63226b783689459c8fa6d6e95d4ae406c04d5116f7f8387876040516106ef93929190610d21565b60405180910390a395945050505050565b5f61070c33848461087e565b50600192915050565b5f5f82116107655760405162461bcd60e51b815260206004820152601c60248201527f53594c3a20616d6f756e74206d75737420626520706f73697469766500000000604482015260640161033b565b5f6107726012600a610cc4565b61077c9084610ccf565b335f908152600160205260409020549091508111156107dd5760405162461bcd60e51b815260206004820152601d60248201527f53594c3a20696e73756666696369656e742053594c2062616c616e6365000000604482015260640161033b565b335f8181526001602090815260408083208054869003905582548590038355518481529192917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a3336001600160a01b03167f2f00057cca861ce8f594de693c8f5be27410d9acb676bb0153f8bbeead7b613a86868460405161086b93929190610d43565b60405180910390a2506001949350505050565b6001600160a01b0383166108d45760405162461bcd60e51b815260206004820152601760248201527f53594c3a207472616e736665722066726f6d207a65726f000000000000000000604482015260640161033b565b6001600160a01b0382166109225760405162461bcd60e51b815260206004820152601560248201527453594c3a207472616e7366657220746f207a65726f60581b604482015260640161033b565b6001600160a01b0383165f908152600160205260409020548111156109805760405162461bcd60e51b815260206004820152601460248201527353594c3a2062616c616e636520746f6f206c6f7760601b604482015260640161033b565b6001600160a01b038084165f81815260016020526040808220805486900390559285168082529083902080548501905591517fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906109e19085815260200190565b60405180910390a3505050565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b80356001600160a01b0381168114610a39575f5ffd5b919050565b5f5f60408385031215610a4f575f5ffd5b610a5883610a23565b946020939093013593505050565b5f5f5f60608486031215610a78575f5ffd5b610a8184610a23565b9250610a8f60208501610a23565b929592945050506040919091013590565b5f5f83601f840112610ab0575f5ffd5b50813567ffffffffffffffff811115610ac7575f5ffd5b602083019150836020828501011115610ade575f5ffd5b9250929050565b5f5f5f5f60608587031215610af8575f5ffd5b8435935060208501359250604085013567ffffffffffffffff811115610b1c575f5ffd5b610b2887828801610aa0565b95989497509550505050565b5f60208284031215610b44575f5ffd5b610b4d82610a23565b9392505050565b5f5f5f60408486031215610b66575f5ffd5b833567ffffffffffffffff811115610b7c575f5ffd5b610b8886828701610aa0565b909790965060209590950135949350505050565b5f5f60408385031215610bad575f5ffd5b610bb683610a23565b9150610bc460208401610a23565b90509250929050565b634e487b7160e01b5f52601160045260245ffd5b6001815b6001841115610c1c57808504811115610c0057610c00610bcd565b6001841615610c0e57908102905b60019390931c928002610be5565b935093915050565b5f82610c32575060016103a2565b81610c3e57505f6103a2565b8160018114610c545760028114610c5e57610c7a565b60019150506103a2565b60ff841115610c6f57610c6f610bcd565b50506001821b6103a2565b5060208310610133831016604e8410600b8410161715610c9d575081810a6103a2565b610ca95f198484610be1565b805f1904821115610cbc57610cbc610bcd565b029392505050565b5f610b4d8383610c24565b80820281158282048414176103a2576103a2610bcd565b808201808211156103a2576103a2610bcd565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b838152604060208201525f610d3a604083018486610cf9565b95945050505050565b604081525f610d56604083018587610cf9565b905082602083015294935050505056fea2646970667358221220891b0b0c90c5cb1651cb65a187cd3ec5f889f4be624433b788bc95689c9aca6e64736f6c63430008270033";

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
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
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
