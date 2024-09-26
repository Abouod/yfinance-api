import customtkinter
from tkinter import BooleanVar, filedialog
import yfinance as yf
import pandas as pd
import datetime

customtkinter.set_appearance_mode("Dark")
customtkinter.set_default_color_theme("dark-blue")

root = customtkinter.CTk()
root.geometry("700x400")
root.title("My application")
root.resizable(width=True, height=True)


# Define the function to run when the Start button is clicked
def convert():
    # Get the company code from the entry widget
    company_code_input = entry1.get()
    print(f"Company Code entered: {company_code_input}")

    # Creating an object for yfinance using the user input
    company_code = yf.Ticker(company_code_input)

    # Get the selected frequency (Yearly or Quarterly)
    selected_frequency = freq_var.get()
    print(f"Selected frequency: {selected_frequency}")
    # print(f"Calendar: {company_code.calendar}")
    # print(f"History: {company_code.history(period="1mo")}") #Consider
    # print(f"Actions: {company_code.actions}")
    # print(f"Splits: {company_code.splits}")
    # print(f"Capital gains: {company_code.capital_gains}")
    # print(f"sec_filings: {company_code.sec_filings}")
    # print(f"analyst_price_targets: {company_code.analyst_price_targets}")
    # print(f"earnings_estimate: {company_code.earnings_estimate}")
    # print(f"revenue_estimate: {company_code.revenue_estimate}")
    # print(f"earnings_history: {company_code.earnings_history}")
    # print(f"eps_trend: {company_code.eps_trend}")
    # print(f"eps_revisions: {company_code.eps_revisions}")
    # print(f"growth_estimates: {company_code.growth_estimates}")
    # print(f"options (shows options expiration): {company_code.options}")
    # print(f"news (show news): {company_code.news}")
    # print(f"recommendations: {company_code.recommendations}")
    # print(f"upgrades_downgrades: {company_code.upgrades_downgrades}")






    # Open file dialog for saving the Excel file
    file_path = filedialog.asksaveasfilename(defaultextension=".xlsx",
                                             filetypes=[("Excel files", "*.xlsx"),
                                                        ("All files", "*.*")],
                                             initialfile=f"{company_code_input}_data_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
                                             )

    if not file_path:  # If user cancels, return
        print("Save operation canceled.")
        return

    with pd.ExcelWriter(file_path, engine="xlsxwriter") as writer:
        # Check which checkboxes are selected and fetch corresponding data
        if info_var.get():
            print("\nFetching company info...")
            info = company_code.info  # Fetch company info
            print(info)  # Fetch and display company info
            info_df = pd.DataFrame(list(info.items()), columns=["Field", "Value"])  # Convert dict to vertical DataFrame
            info_df.to_excel(writer, sheet_name="Company Info", index=False)  # Save to "Company Info" sheet


        if balance_sheet_var.get():
            if selected_frequency == "Yearly":
                print("\nFetching yearly company balance sheet...")
                balance_sheet_df = company_code.balance_sheet
            else:
                print("\nFetching quarterly company balance sheet...")
                balance_sheet_df = company_code.quarterly_balance_sheet
            balance_sheet_df.to_excel(writer, sheet_name="Balance Sheet")
            print(balance_sheet_df)  # Fetch and display balance sheet

        if income_statement_var.get():
            if selected_frequency == "Yearly":
                print("\nFetching yearly company income statement...")
                income_statement_df = company_code.financials
            else:
                print("\nFetching quarterly company income statement...")
                income_statement_df = company_code.quarterly_financials
            income_statement_df.to_excel(writer, sheet_name="Income Statement")
            print(income_statement_df)

        if cash_flow_var.get():
            if selected_frequency == "Yearly":
                print("\nFetching yearly company cash flow...")
                cash_flow_df = company_code.cashflow
            else:
                print("\nFetching quarterly company cash flow...")
                cash_flow_df = company_code.quarterly_cashflow
            cash_flow_df.to_excel(writer, sheet_name="Cash Flow")
            print(cash_flow_df)

        if dividends_var.get():
            print("\nFetching dividends")
            dividends_df = company_code.dividends

            # Remove timezone information from the index if it contains datetime with tz info
            if pd.api.types.is_datetime64_any_dtype(dividends_df.index):
                dividends_df.index = dividends_df.index.tz_localize(None)

            dividends_df.to_excel(writer, sheet_name="Dividends")
            print(dividends_df)

frame = customtkinter.CTkFrame(master=root)
frame.pack(pady=20, padx=60, fill="both", expand=True)

label = customtkinter.CTkLabel(master=frame, text="YFinance Data Extractor", font=("Roboto", 24))
label.pack(pady=12, padx=10)

entry1 = customtkinter.CTkEntry(master=frame, placeholder_text="Company Code")
entry1.pack(pady=12, padx=12)

# Add radio buttons for choosing yearly or quarterly data
freq_var = customtkinter.StringVar(value="Yearly")  # Default is Yearly
radio_frame = customtkinter.CTkFrame(master=frame)
radio_frame.pack(pady=12)

radio_yearly = customtkinter.CTkRadioButton(master=radio_frame, text="Yearly", variable=freq_var, value="Yearly")
radio_yearly.grid(row=0, column=0, padx=10)

radio_quarterly = customtkinter.CTkRadioButton(master=radio_frame, text="Quarterly", variable=freq_var,
                                               value="Quarterly")
radio_quarterly.grid(row=0, column=1, padx=10)

# Create a frame for the checkboxes
checkbox_frame = customtkinter.CTkFrame(master=frame)
checkbox_frame.pack(pady=12, padx=10)

# Create checkboxes for user to select the type of data to view
info_var = customtkinter.BooleanVar()
balance_sheet_var = customtkinter.BooleanVar()
income_statement_var = customtkinter.BooleanVar()
cash_flow_var = customtkinter.BooleanVar()
dividends_var = customtkinter.BooleanVar()


# Arrange checkboxes horizontally using grid
checkbox_info = customtkinter.CTkCheckBox(master=checkbox_frame, text="Info", variable=info_var, onvalue=True,
                                          offvalue=False)
checkbox_info.grid(row=0, column=0, padx=10, pady=6)

checkbox_balance_sheet = customtkinter.CTkCheckBox(master=checkbox_frame, text="Balance Sheet",
                                                   variable=balance_sheet_var, onvalue=True, offvalue=False)
checkbox_balance_sheet.grid(row=0, column=1, padx=10, pady=6)

checkbox_cash_flow = customtkinter.CTkCheckBox(master=checkbox_frame, text="Cash Flow", variable=cash_flow_var,
                                               onvalue=True, offvalue=False)
checkbox_cash_flow.grid(row=0, column=2, padx=10, pady=6)

checkbox_income_statement = customtkinter.CTkCheckBox(master=checkbox_frame, text="Income Statement",
                                                      variable=income_statement_var, onvalue=True, offvalue=False)
checkbox_income_statement.grid(row=1, column=1, padx=10, pady=6)

checkbox_dividends = customtkinter.CTkCheckBox(master=checkbox_frame, text="dividends",
                                                      variable=dividends_var, onvalue=True, offvalue=False)
checkbox_dividends.grid(row=1, column=0, padx=10, pady=6)

button = customtkinter.CTkButton(master=frame, text="Start", command=convert)
button.pack(pady=12, padx=10)

# Start the GUI main loop
root.mainloop()
