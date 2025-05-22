import argparse
import pandas as pd


def convert_parquet_to_excel(input_file, output_file):
    """
    Converts a Parquet file to either CSV or Excel format, depending on the
    output file extension.
    """
    try:
        # Load the Parquet file into a DataFrame
        df = pd.read_parquet(input_file)

        # Determine output format and write accordingly
        if output_file.endswith(".csv"):
            df.to_csv(output_file, index=False)
            print(f"✅ Successfully converted to {output_file} (CSV format).")
        elif output_file.endswith(".xlsx"):
            df.to_excel(output_file, index=False, engine="openpyxl")
            print(f"✅ Successfully converted to {output_file} (Excel format).")
        else:
            raise ValueError(
                "⚠️ Unsupported output format. Use .csv or .xlsx.")

    except FileNotFoundError:
        print("❌ Error: Input file not found.")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    # Set up command-line argument parsing
    parser = argparse.ArgumentParser(
        description="Convert a Parquet file to CSV or Excel.")
    parser.add_argument("input", help="Path to the input Parquet file.")
    parser.add_argument(
        "output", help="Path to the output file (CSV or Excel).")
    args = parser.parse_args()

    # Run the conversion
    convert_parquet_to_excel(args.input, args.output)
