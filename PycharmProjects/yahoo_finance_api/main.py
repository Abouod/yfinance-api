import yfinance as yf

import pandas as pd

#Creating an object for yfinance
company_code = yf.Ticker("2010.SR") #Enter specific company ticker in the quotes

# Fetching financial data
financials_df = company_code.financials  # Yearly financials
quarterly_financials_df = company_code.quarterly_financials  # Quarterly financials

# Print the DataFrames to check for TTM values
print("Yearly Financials:")
print(financials_df)

print("\nQuarterly Financials:")
print(quarterly_financials_df)

# Calculating TTM Revenue
# Ensure to sum the latest four quarters only
if 'Total Revenue' in quarterly_financials_df.index:
    ttm_revenue = quarterly_financials_df.loc['Total Revenue'].sum()  # Sum the last four quarters
    print("\nTTM Revenue:", ttm_revenue)

# Optionally, print specific quarters to understand the components of TTM
print("\nTotal Revenue per Quarter:")
print(quarterly_financials_df.loc['Total Revenue'])

# List of rows you want to access
rows_of_interest = ['Total Revenue', 'Net Income', 'Operating Income']


# Accessing multiple rows
#In pandas, .loc is an accessor used to access a group of rows and columns by labels or a boolean array.
financial_data = quarterly_financials_df.loc[rows_of_interest]

print("\nRows of interest:")
print(financial_data)


# Print the financial data
print(financial_data)










