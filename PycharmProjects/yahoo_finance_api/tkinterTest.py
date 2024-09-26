import customtkinter
import yfinance as yf
import pandas as pd

customtkinter.set_appearance_mode("Dark")
customtkinter.set_default_color_theme("dark-blue")

root = customtkinter.CTk()
root.geometry("700x400")
root.title("My application")
root.resizable(width=False, height=True)


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

    # Create an ExcelWriter object to write multiple sheets to a single Excel file
    # Use company_code_input for the filename
    filename = f"{company_code_input}_data.xlsx"  # Create filename using f-string
    with pd.ExcelWriter(filename, engine="xlsxwriter") as writer:

        # Check which checkboxes are selected and fetch corresponding data
        if info_var.get():
            print("\nFetching company info...")
            info = company_code.info  # Fetch company info
            print(info)  # Fetch and display company info
            info_df = pd.DataFrame([info])  # Convert to DataFrame
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
info_var = customtkinter.StringVar()
balance_sheet_var = customtkinter.StringVar()
income_statement_var = customtkinter.StringVar()
cash_flow_var = customtkinter.StringVar()

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
checkbox_income_statement.grid(row=0, column=3, padx=10, pady=6)

button = customtkinter.CTkButton(master=frame, text="Start", command=convert)
button.pack(pady=12, padx=10)

# Start the GUI main loop
root.mainloop()
