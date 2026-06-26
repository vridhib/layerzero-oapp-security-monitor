from web3 import Web3
from django.core.exceptions import ValidationError

def validate_ethereum_address(value: str) -> str:
    """Validate and normalize an Ethereum address."""
    if not Web3.is_address(value):
        raise ValidationError('Invalid Ethereum address format.')
    return value.lower()