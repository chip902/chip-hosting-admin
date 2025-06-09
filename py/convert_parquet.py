import argparse
import pandas as pd


def get_parquet_reader(input_file, chunk_size=10000):
    """
    Create a Parquet reader that yields chunks of the file.

    Args:
        input_file (str): Path to the input Parquet file
        chunk_size (int): Number of rows to read at a time
    """
    try:
        # First, read just the schema to get column information
        pf = pd.read_parquet(input_file, engine='pyarrow')
        return pf  # Return the full DataFrame for now
    except Exception as e:
        raise Exception(f"Error reading Parquet file: {str(e)}")


def process_single_parquet(input_file, output_file, debug=False):
    """
    Process a single Parquet file and convert it to the desired output format.

    Args:
        input_file (str): Path to the input Parquet file
        output_file (str): Path to the output file (CSV or Excel)
        debug (bool): If True, print debug information about the data

    Returns:
        bool: True if conversion was successful, False otherwise
    """
    try:
        if debug:
            print(f"\n🔍 Reading Parquet file: {input_file}")

        # Read the Parquet file
        df = pd.read_parquet(input_file)

        if debug:
            print(f"- Shape: {df.shape} (rows, columns)")
            print(f"- Columns: {list(df.columns)}")
            print(f"- First few rows: {len(df)} total rows")
            print(df.head())
            print("\n📊 Data types:")
            print(df.dtypes)
            print("\n📈 Basic statistics:")
            print(df.describe(include='all'))

        # Determine output format and write accordingly
        if output_file.endswith(".csv"):
            df.to_csv(output_file, index=False)
            print(f"✅ Successfully converted to {output_file} (CSV format).")
            return True

        elif output_file.endswith(".xlsx"):
            # Make a copy of the dataframe to avoid modifying the original
            df_excel = df.copy()

            # Convert timezone-aware datetime columns to timezone-naive
            datetime_cols = df_excel.select_dtypes(
                include=['datetime64[ns, UTC]']).columns
            for col in datetime_cols:
                df_excel[col] = df_excel[col].dt.tz_convert(None)

            df_excel.to_excel(output_file, index=False, engine="openpyxl")
            print(f"✅ Successfully converted to {output_file} (Excel format).")
            return True

        else:
            print(
                f"⚠️ Unsupported output format: {output_file}. Use .csv or .xlsx.")
            return False

    except Exception as e:
        print(f"❌ Error processing {input_file}: {str(e)}")
        if debug:
            import traceback
            traceback.print_exc()
        return False


def combine_parquet_files(parquet_files, output_file, debug=False):
    """
    Combine multiple Parquet files into a single output file.

    Args:
        parquet_files (list): List of Path objects to Parquet files
        output_file (str): Path to the output file
        debug (bool): If True, print debug information

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if debug:
            print(f"\nCombining {len(parquet_files)} files into {output_file}")

        # Read all DataFrames into a list
        dfs = []
        for i, parquet_file in enumerate(parquet_files, 1):
            if debug:
                print(
                    f"Reading file {i}/{len(parquet_files)}: {parquet_file.name}")
            df = pd.read_parquet(parquet_file)
            dfs.append(df)

        if not dfs:
            print("⚠️ No data found in any of the Parquet files")
            return False

        # Concatenate all DataFrames
        combined_df = pd.concat(dfs, ignore_index=True)

        if debug:
            print(f"Combined DataFrame shape: {combined_df.shape}")

        # Write to output file
        if output_file.endswith('.csv'):
            combined_df.to_csv(output_file, index=False)
        else:  # Default to xlsx
            # Handle timezone-aware datetime columns for Excel
            datetime_cols = combined_df.select_dtypes(
                include=['datetime64[ns, UTC]']).columns
            for col in datetime_cols:
                combined_df[col] = combined_df[col].dt.tz_convert(None)
            combined_df.to_excel(output_file, index=False, engine="openpyxl")

        print(f"✅ Successfully combined data into {output_file}")
        return True

    except Exception as e:
        print(f"❌ Error combining files: {str(e)}")
        if debug:
            import traceback
            traceback.print_exc()
        return False


def convert_parquet_to_excel(input_path, output_path, debug=False, chunk_size=10000, combine=False):
    """
    Converts Parquet file(s) to either CSV or Excel format.

    Args:
        input_path (str): Path to the input Parquet file or directory
        output_path (str): Path to the output file or directory
        debug (bool): If True, print debug information about the data
        chunk_size (int): Number of rows to process at a time (for memory efficiency)
        combine (bool): If True, combine all files into a single output file

    Returns:
        bool: True if all conversions were successful, False otherwise
    """
    from pathlib import Path

    try:
        if debug:
            print("\n" + "="*50)
            print(f"Starting conversion with pandas version: {pd.__version__}")
            print(f"Input path: {input_path}")
            print(f"Output path: {output_path}")
            if combine:
                print("Mode: Combining all files into a single output")
            else:
                print("Mode: Processing files individually")

        # Check if input is a file or directory
        input_path = Path(input_path)
        output_path = Path(output_path)

        if input_path.is_file():
            # Single file conversion
            if debug:
                print("Processing single file...")
            return process_single_parquet(str(input_path), str(output_path), debug)

        elif input_path.is_dir():
            # Process all .parquet files in the directory
            if debug:
                print(f"Processing directory: {input_path}")

            # Find all parquet files in the directory
            parquet_files = sorted(list(input_path.glob(
                "*.parquet")) + list(input_path.glob("*.parq")))

            if not parquet_files:
                print(f"⚠️ No Parquet files found in {input_path}")
                return False

            if debug:
                print(f"Found {len(parquet_files)} Parquet files to process")

            # If combine is True, combine all into one file
            if combine:
                # If output is a directory, create a default filename
                if output_path.is_dir() or not output_path.suffix:
                    output_file = output_path / "combined_output.xlsx"
                else:
                    output_file = output_path
                return combine_parquet_files(parquet_files, str(output_file), debug)

            # If not combining, create output directory if it doesn't exist
            if not output_path.exists():
                output_path.mkdir(parents=True, exist_ok=True)

            success_count = 0
            for i, parquet_file in enumerate(parquet_files, 1):
                if debug:
                    print(
                        f"\nProcessing file {i}/{len(parquet_files)}: {parquet_file.name}")

                # Create output file path with same name but different extension
                if output_path.suffix in ['.csv', '.xlsx']:
                    # If output_path has an extension, use it as a base
                    output_file = output_path.parent / \
                        f"{parquet_file.stem}{output_path.suffix}"
                else:
                    # If output_path is a directory, create a file with the same name as input
                    output_file = output_path / \
                        f"{parquet_file.stem}.xlsx"  # Default to xlsx

                if process_single_parquet(str(parquet_file), str(output_file), debug):
                    success_count += 1

            print(
                f"\n🎉 Successfully processed {success_count} out of {len(parquet_files)} files")
            return success_count == len(parquet_files)

        else:
            print(f"❌ Input path does not exist: {input_path}")
            return False

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        if debug:
            import traceback
            traceback.print_exc()
        return False


if __name__ == "__main__":
    # Set up command-line argument parsing
    parser = argparse.ArgumentParser(
        description="Convert Parquet file(s) to CSV or Excel format.")
    parser.add_argument("input",
                        help="Path to the input Parquet file or directory containing Parquet files")
    parser.add_argument("output",
                        help="Path to the output file (CSV or Excel) or directory")
    parser.add_argument("--debug", action="store_true",
                        help="Enable debug output with detailed information about the data")
    parser.add_argument("--combine", action="store_true",
                        help="Combine all input files into a single output file (only works when output is a file, not a directory)")
    args = parser.parse_args()

    # Run the conversion with the specified options
    convert_parquet_to_excel(
        input_path=args.input,
        output_path=args.output,
        debug=args.debug,
        combine=args.combine
    )
