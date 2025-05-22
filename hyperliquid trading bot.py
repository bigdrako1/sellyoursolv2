'''
this bot is trading into liquidations so oppposed to buying bigs its actually looking for small liqs and then entering that way assuming
that small liqs lead to big liqs

'''

order_usd_size = 10

leverage = 3 
timeframe = '4h'

# Define symbol-specific parameters
symbols = ['WIF']

symbols_data = {
    'BTC': {
        'liquations': 900000,
        'time_window_mins': 24,  # Default time window in minutes, will be optimized
        'sl': -2,
        'tp': 1
    },
    'ETH': {
        'liquations': 500000, # .09% return vs -5.5% buy and hold
        'time_window_mins': 4,  # Default time window in minutes, will be optimized
        'sl': -2,
        'tp': 1
    },
    'SOL': {
        'liquations': 300000,
        'time_window_mins': 4,  # Default time window in minutes, will be optimized
        'sl': -2,
        'tp': 1
    },
    'WIF': {
        'liquations': 10000,
        'time_window_mins': 5,  # Default time window in minutes, will be optimized
        'sl': -6, # 3x lev so 6 = 2
        'tp': 6

    # liquidation_thresh = 100000
    # time_window_mins = 14
    # take_profit = 0.01
    # stop_loss = 0.05
    # slippage = 0.02  # Added 2% slippage
    },
    'kPEPE': {
        'liquations': 50000,
        'time_window_mins': 4,  # Default time window in minutes, will be optimized
        'sl': -1,
        'tp': 2
    }
}


# Function to get the buy/sell range for a symbol
def get_ranges(symbol):
    return symbols_data.get(symbol, {'buy_range': (0, 0), 'sell_range': (0, 0)})

import sys
import os
import numpy as np
from datetime import datetime, timedelta, timezone

# Directory containing nice_funcs.py
nice_funcs_path = '/Users/md/Dropbox/dev/github/hyper-liquid-trading-bots'

# Add the directory to the sys.path
if nice_funcs_path not in sys.path:
    sys.path.append(nice_funcs_path)

import nice_funcs as n 
from eth_account.signers.local import LocalAccount
import eth_account
import json
import time, random  
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from hyperliquid.utils import constants
import ccxt
import pandas as pd
import schedule 
import requests 
from dontshareconfig import secret
import io
from dontshareconfig import moondev_api_key

# Fetch symbols from the API
def get_symbols():
    url = 'https://api.hyperliquid.xyz/info'
    headers = {'Content-Type': 'application/json'}
    data = {'type': 'meta'}

    response = requests.post(url, headers=headers, json=data)
    if response.status_code != 200:
        print('Error:', response.status_code)
        return []

    data = response.json()
    symbols = [symbol['name'] for symbol in data['universe']]
    print("Fetched Symbols:", symbols)
    return symbols

# Fetch candle snapshot for a given symbol and time range
def fetch_candle_snapshot(symbol, interval, start_time, end_time):
    url = 'https://api.hyperliquid.xyz/info'
    headers = {'Content-Type': 'application/json'}
    data = {
        "type": "candleSnapshot",
        "req": {
            "coin": symbol,
            "interval": interval,
            "startTime": int(start_time.timestamp() * 1000),
            "endTime": int(end_time.timestamp() * 1000)
        }
    }

    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        snapshot_data = response.json()
        if 'candles' in snapshot_data:
            return snapshot_data['candles']
        else:
            return snapshot_data  # Adjust if the structure is different
    else:
        print(f"Error fetching data for {symbol}: {response.status_code}")
        return None

# Fetch daily data for calculating resistance levels
def fetch_daily_data(symbol, days=20):
    end_time = datetime.now()
    start_time = end_time - timedelta(days=days)
    return fetch_candle_snapshot(symbol, '1d', start_time, end_time)

# Calculate daily resistance levels
def calculate_daily_resistance(symbols):
    resistance_levels = {}
    for symbol in symbols:
        daily_data = fetch_daily_data(symbol)
        if daily_data:
            high_prices = [float(day['h']) for day in daily_data]
            resistance_levels[symbol] = max(high_prices)
            print(f"Resistance level for {symbol}: {resistance_levels[symbol]}")
    return resistance_levels


import pandas as pd
from datetime import datetime, timedelta

def get_liq_data(symbol, time_window_mins):
    '''
    Get liquidation data directly from moondev API for the specified symbol and time window.
    '''
    try:
        # API configuration
        API_KEY = moondev_api_key
        BASE_URL = 'http://api.moondev.com:8000'
        headers = {'X-API-Key': API_KEY}

        # Fetch liquidation data directly from API
        response = requests.get(f'{BASE_URL}/files/liq_data.csv?limit=100000', headers=headers)
        response.raise_for_status()
        
        # Convert response to DataFrame
        df = pd.read_csv(io.StringIO(response.text))
        df = df.iloc[1:].reset_index(drop=True)  # Drop the first row which contains old data

        # Assume the first column is the symbol, the last column is usd_size, and the second-to-last column is order_trade_time
        df.columns = range(len(df.columns))
        symbol_col = df.columns[0]
        trade_time_col = df.columns[-2]
        usd_size_col = df.columns[-1]
        
        # Get latest liquidation price for the symbol (from column 5)
        symbol_data = df[df[symbol_col] == symbol]
        latest_liq_price = float(symbol_data[5].iloc[-1]) if not symbol_data.empty else None
        print(f"Latest liquidation price for {symbol}: {latest_liq_price}")

        # Convert epoch to datetime and set timezone to UTC
        df[trade_time_col] = pd.to_datetime(df[trade_time_col], unit='ms').dt.tz_localize('UTC')
        df.set_index(trade_time_col, inplace=True)

        # Get the current time in UTC and filter time window
        current_time = datetime.now(timezone.utc)
        start_time = current_time - timedelta(minutes=time_window_mins)

        # Filter for symbol and time window
        df = df[df[symbol_col] == symbol]
        df = df[(df.index >= start_time) & (df.index <= current_time)]

        print(df.tail())

        # Sum the liquidation sizes
        total_liquidation_usd = df[usd_size_col].sum()

        return total_liquidation_usd, latest_liq_price

    except Exception as e:
        print(f"Error fetching liquidation data: {e}")
        return 0, None

# print(get_liq_data('SOL', 140))
# time.sleep(103)

def main():
    account1 = LocalAccount = eth_account.Account.from_key(secret)

    for symbol in symbols:
        print(f"\n🔍 Checking {symbol}...")
        
        # First check if we're in a position
        positions, im_in_pos, pos_size, pos_sym, entry_px, pnl_perc, long = n.get_position(symbol, account1)
        
        if im_in_pos:
            print(f"📊 Current PNL for {symbol}: {pnl_perc:.2f}%")
            n.pnl_close(symbol, symbols_data[symbol]['tp'], symbols_data[symbol]['sl'], account1)
            continue
            
        # Only fetch liquidation data if we're not in a position
        print(f"🎯 No position in {symbol}, checking liquidations...")
        liquidation_amount, liq_price = get_liq_data(symbol, symbols_data[symbol]['time_window_mins'])
        
        if liq_price is None:
            print(f"⚠️ No liquidation price found for {symbol}, skipping...")
            continue

        # Get current market price
        current_price, _, _ = n.ask_bid(symbol)
        print(f"💹 {symbol} Stats:")
        print(f"  • Liquidations: ${liquidation_amount:,.2f}")
        print(f"  • Liq Price: ${liq_price:.3f}")
        print(f"  • Current: ${current_price:.3f}")

        # Check if liquidation threshold is met
        if liquidation_amount >= symbols_data[symbol]['liquations']:
            print(f"🔥 Liquidation threshold met for {symbol}!")
            
            # Adjust leverage and get position size
            lev, size = n.adjust_leverage_usd_size(symbol, order_usd_size, leverage, account1)
            
            # Get price decimals for rounding
            _, px_decimals = n.get_sz_px_decimals(symbol)
            
            # Calculate entry price slightly below liquidation price
            entry_price = round(liq_price * 0.995, px_decimals)  # 0.5% below liq price
            
            print(f"🎯 Placing SHORT order for {symbol}")
            print(f"💰 Size: {size} | Entry: ${entry_price:.3f} | Leverage: {lev}x")

            n.cancel_symbol_orders(account1, symbol)
            
            # Place the short order
            n.limit_order(
                coin=symbol,
                is_buy=False,  # SHORT
                sz=size,
                limit_px=entry_price,
                reduce_only=False,
                account=account1
            )
            print(f"✨ SHORT order placed for {symbol}! Thanks Moon Dev! 🌙")

print('running algo...')
main()
schedule.every(29).seconds.do(main)

while True:
    try:
        schedule.run_pending()
        time.sleep(1)
    except Exception as e:
        print(f"Encountered an error: {e}")
        time.sleep(10)
