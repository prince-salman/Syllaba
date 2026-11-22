// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SyllabaCertificateSBT
 * @notice Soulbound ERC-721 Credential Contract (ERC-5192 compatible) for Syllaba Academic Protocol
 *         on Base Sepolia (Chain ID 84532). Issues non-transferable on-chain academic NFTs for
 *         both Per-PPT Graduation Certificates and Cross-PPT Tier Certificates (Bronze -> Emerald).
 */
contract SyllabaCertificateSBT {
    string public constant name = "Syllaba Academic Certificate SBT";
    string public constant symbol = "SYLCERT";

    uint256 private _nextTokenId = 1;
    address public immutable deployer;

    struct CertMetadata {
        address recipient;
        string certKind;
        string courseTitle;
        string recipientName;
        uint256 points;
        uint256 finalGrade;
        bytes32 certDigest;
        string ipfsCid;
        uint64 issuedAt;
    }

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => CertMetadata) private _certs;
    mapping(bytes32 => uint256) public tokenByDigest;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event Locked(uint256 indexed tokenId);
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        bytes32 indexed certDigest,
        string certKind,
        string courseTitle,
        uint256 points,
        uint256 finalGrade,
        string ipfsCid
    );

    constructor() {
        deployer = msg.sender;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC-165
            interfaceId == 0x80ac58cd || // ERC-721
            interfaceId == 0x5b5e139f || // ERC-721Metadata
            interfaceId == 0xb45a3c0e;   // ERC-5192 Minimal Soulbound
    }

    function locked(uint256 tokenId) external view returns (bool) {
        require(_owners[tokenId] != address(0), "SYLCERT: nonexistent token");
        return true;
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "SYLCERT: zero address");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "SYLCERT: nonexistent token");
        return owner;
    }

    function getCertificate(uint256 tokenId) external view returns (CertMetadata memory) {
        require(_owners[tokenId] != address(0), "SYLCERT: nonexistent token");
        return _certs[tokenId];
    }

    function mintCertificate(
        bytes32 certDigest,
        string calldata certKind,
        string calldata courseTitle,
        string calldata recipientName,
        uint256 points,
        uint256 finalGrade,
        string calldata ipfsCid
    ) external returns (uint256 tokenId) {
        return _mintInternal(
            msg.sender,
            certDigest,
            certKind,
            courseTitle,
            recipientName,
            points,
            finalGrade,
            ipfsCid
        );
    }

    /// @notice Gasless protocol relayer entry point so sponsored mints assign ERC-721 ownership directly to the student.
    function mintCertificateFor(
        address recipient,
        bytes32 certDigest,
        string calldata certKind,
        string calldata courseTitle,
        string calldata recipientName,
        uint256 points,
        uint256 finalGrade,
        string calldata ipfsCid
    ) external returns (uint256 tokenId) {
        require(msg.sender == deployer, "SYLCERT: only deployer relayer");
        require(recipient != address(0), "SYLCERT: zero recipient");
        return _mintInternal(
            recipient,
            certDigest,
            certKind,
            courseTitle,
            recipientName,
            points,
            finalGrade,
            ipfsCid
        );
    }

    function _mintInternal(
        address recipient,
        bytes32 certDigest,
        string calldata certKind,
        string calldata courseTitle,
        string calldata recipientName,
        uint256 points,
        uint256 finalGrade,
        string calldata ipfsCid
    ) private returns (uint256 tokenId) {
        require(certDigest != bytes32(0), "SYLCERT: empty digest");
        require(tokenByDigest[certDigest] == 0, "SYLCERT: digest already minted");

        tokenId = _nextTokenId;
        unchecked {
            _nextTokenId = tokenId + 1;
            _balances[recipient] += 1;
        }
        _owners[tokenId] = recipient;
        tokenByDigest[certDigest] = tokenId;

        _certs[tokenId] = CertMetadata({
            recipient: recipient,
            certKind: certKind,
            courseTitle: courseTitle,
            recipientName: recipientName,
            points: points,
            finalGrade: finalGrade,
            certDigest: certDigest,
            ipfsCid: ipfsCid,
            issuedAt: uint64(block.timestamp)
        });

        emit Transfer(address(0), recipient, tokenId);
        emit Locked(tokenId);
        emit CertificateMinted(
            tokenId,
            recipient,
            certDigest,
            certKind,
            courseTitle,
            points,
            finalGrade,
            ipfsCid
        );
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "SYLCERT: nonexistent token");
        CertMetadata storage m = _certs[tokenId];

        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360">',
            '<rect width="600" height="360" rx="24" fill="#0B0B10"/>',
            '<rect x="14" y="14" width="572" height="332" rx="18" fill="none" stroke="#FACC15" stroke-width="2"/>',
            '<text x="36" y="56" fill="#FACC15" font-family="sans-serif" font-size="13" font-weight="700">SYLLABA ACADEMIC SOULBOUND CERTIFICATE</text>',
            '<text x="36" y="108" fill="#FFFFFF" font-family="sans-serif" font-size="24" font-weight="800">',
            _sanitize(m.recipientName),
            '</text>',
            '<text x="36" y="148" fill="#E2E8F0" font-family="sans-serif" font-size="15">',
            _sanitize(m.courseTitle),
            '</text>',
            '<text x="36" y="210" fill="#FACC15" font-family="monospace" font-size="14">TYPE: ',
            _sanitize(m.certKind),
            ' | POINTS: ',
            _toString(m.points),
            ' | SCORE: ',
            _toString(m.finalGrade),
            '/100</text>',
            '<text x="36" y="265" fill="#94A3B8" font-family="monospace" font-size="12">TOKEN #',
            _toString(tokenId),
            ' | BASE SEPOLIA (84532)</text>',
            '</svg>'
        );

        string memory json = string.concat(
            '{"name":"Syllaba ',
            _sanitize(m.certKind),
            ' #',
            _toString(tokenId),
            '","description":"Non-transferable Soulbound academic credential verified on Base Sepolia by Syllaba.",',
            '"image":"data:image/svg+xml;base64,',
            _base64(bytes(svg)),
            '","attributes":[{"trait_type":"Type","value":"',
            _sanitize(m.certKind),
            '"},{"trait_type":"Course","value":"',
            _sanitize(m.courseTitle),
            '"},{"trait_type":"Points","value":',
            _toString(m.points),
            '},{"trait_type":"Score","value":',
            _toString(m.finalGrade),
            '}]}'
        );

        return string.concat("data:application/json;base64,", _base64(bytes(json)));
    }

    // Soulbound: block all transfers and approvals
    function approve(address, uint256) external pure {
        revert("SYLCERT: Soulbound non-transferable");
    }

    function getApproved(uint256) external pure returns (address) {
        return address(0);
    }

    function setApprovalForAll(address, bool) external pure {
        revert("SYLCERT: Soulbound non-transferable");
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    function transferFrom(address, address, uint256) external pure {
        revert("SYLCERT: Soulbound non-transferable");
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert("SYLCERT: Soulbound non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert("SYLCERT: Soulbound non-transferable");
    }

    function _sanitize(string memory input) private pure returns (string memory) {
        bytes memory b = bytes(input);
        uint256 len = b.length > 48 ? 48 : b.length;
        bytes memory out = new bytes(len);
        for (uint256 i = 0; i < len; i++) {
            bytes1 ch = b[i];
            if (ch == '"' || ch == "<" || ch == ">" || ch == "\\" || uint8(ch) < 32) {
                out[i] = " ";
            } else {
                out[i] = ch;
            }
        }
        return string(out);
    }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function _base64(bytes memory data) private pure returns (string memory) {
        bytes memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 len = data.length;
        if (len == 0) return "";
        uint256 encodedLen = 4 * ((len + 2) / 3);
        bytes memory result = new bytes(encodedLen);
        uint256 i = 0;
        uint256 j = 0;
        while (i < len) {
            uint256 a = i < len ? uint8(data[i++]) : 0;
            uint256 b = i < len ? uint8(data[i++]) : 0;
            uint256 c = i < len ? uint8(data[i++]) : 0;
            uint256 triple = (a << 16) | (b << 8) | c;
            result[j++] = table[(triple >> 18) & 0x3f];
            result[j++] = table[(triple >> 12) & 0x3f];
            result[j++] = table[(triple >> 6) & 0x3f];
            result[j++] = table[triple & 0x3f];
        }
        uint256 mod = len % 3;
        if (mod == 1) {
            result[encodedLen - 1] = "=";
            result[encodedLen - 2] = "=";
        } else if (mod == 2) {
            result[encodedLen - 1] = "=";
        }
        return string(result);
    }
}
