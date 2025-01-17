import glob
import pandas as pd

# specify the directory where the csv files are located
csv_dir = '/Users/andrew/Downloads/cja'

# find all csv files in the directory
csv_files = glob.glob(f'{csv_dir}/*.csv')

# create an empty dataframe with a header row
combined_df = pd.DataFrame()
header = True

# loop through each csv file and append it to the combined dataframe
for csv_file in csv_files:
    df = pd.read_csv(csv_file, header=None if header else None)
    if header:
        # add the header row only on the first iteration
        combined_df = df.loc[0].to_frame().T
        header = False
    else:
        combined_df = combined_df._append(df, ignore_index=True)

# save the combined dataframe as a new csv file
combined_df.to_csv('combined_data.csv', index=False)