import { isValidAddress } from '@ethos/helpers';
import { formatEther, parseEther } from 'ethers';
import { type ArgumentsCamelCase, type Argv } from 'yargs';
import { Validator } from '../utils/input';
import { error, out, txn } from '../utils/output';
import { type WalletManager } from '../utils/walletManager';
import { Command, Subcommand } from './command';

class CreateMarket extends Subcommand {
  public readonly name = 'create';
  public readonly description = 'Create a new reputation market';
  public readonly arguments = (yargs: Argv): Argv =>
    yargs.options({
      profileId: {
        type: 'number',
        alias: 'p',
        describe: 'Profile ID for the market',
        demandOption: true,
      },
      initialLiquidity: {
        type: 'string',
        alias: 'l',
        describe: 'Initial liquidity to provide (in ETH)',
        demandOption: true,
      },
    });

  public async method(user: WalletManager, argv: ArgumentsCamelCase<unknown>): Promise<void> {
    const profileId = new Validator(argv).Integer('profileId');
    const initialLiquidity = new Validator(argv).Float('initialLiquidity');

    out(`🏗️ Creating market for profile ID: ${profileId}`);
    await txn(
      user.connect.reputationMarket.createMarket(
        profileId,
        parseEther(initialLiquidity.toString()),
      ),
    );
  }
}

class BuyVotes extends Subcommand {
  public readonly name = 'buy';
  public readonly description = 'Buy votes in a reputation market';
  public readonly arguments = (yargs: Argv): Argv =>
    yargs.options({
      profileId: {
        type: 'number',
        alias: 'p',
        describe: 'Profile ID of the market',
        demandOption: true,
      },
      isPositive: {
        type: 'boolean',
        alias: 'i',
        describe: 'Buy positive votes (true) or negative votes (false)',
        demandOption: true,
      },
      amount: {
        type: 'string',
        alias: 'a',
        describe: 'Amount to spend (in ETH)',
        demandOption: true,
      },
      maxVotes: {
        type: 'string',
        alias: 'm',
        describe: 'Maximum number of votes to buy (default: unlimited)',
        default: '9999999999999999999999999999999',
        demandOption: false,
      },
    });

  public async method(user: WalletManager, argv: ArgumentsCamelCase<unknown>): Promise<void> {
    const profileId = new Validator(argv).Integer('profileId');
    const isPositive = new Validator(argv).Boolean('isPositive');
    const amount = new Validator(argv).Float('amount');
    const maxVotes = new Validator(argv).BigInt('maxVotes');

    out(`💰 Buying ${isPositive ? 'positive' : 'negative'} votes for profile ID: ${profileId}`);
    await txn(
      user.connect.reputationMarket.buyVotes(
        profileId,
        isPositive,
        parseEther(amount.toString()),
        maxVotes,
      ),
    );
  }
}

class SellVotes extends Subcommand {
  public readonly name = 'sell';
  public readonly description = 'Sell votes in a reputation market';
  public readonly arguments = (yargs: Argv): Argv =>
    yargs.options({
      profileId: {
        type: 'number',
        alias: 'p',
        describe: 'Profile ID of the market',
        demandOption: true,
      },
      isPositive: {
        type: 'boolean',
        alias: 'i',
        describe: 'Sell positive votes (true) or negative votes (false)',
        demandOption: true,
      },
      amount: {
        type: 'number',
        alias: 'a',
        describe: 'Number of votes to sell',
        demandOption: true,
      },
    });

  public async method(user: WalletManager, argv: ArgumentsCamelCase<unknown>): Promise<void> {
    const profileId = new Validator(argv).Integer('profileId');
    const isPositive = new Validator(argv).Boolean('isPositive');
    const amount = new Validator(argv).Integer('amount');

    out(
      `💱 Selling ${amount} ${isPositive ? 'positive' : 'negative'} votes for profile ID: ${profileId}`,
    );
    await txn(user.connect.reputationMarket.sellVotes(profileId, isPositive, amount));
  }
}

class GetMarketInfo extends Subcommand {
  public readonly name = 'info';
  public readonly description = 'Get information about a reputation market';
  public readonly arguments = (yargs: Argv): Argv =>
    yargs.options({
      profileId: {
        type: 'number',
        alias: 'p',
        describe: 'Profile ID of the market',
        demandOption: true,
      },
    });

  public async method(user: WalletManager, argv: ArgumentsCamelCase<unknown>): Promise<void> {
    const profileId = new Validator(argv).Integer('profileId');

    const wallet = await user.getActiveWallet();

    if (!isValidAddress(wallet.address)) {
      error('No active wallet found');
      process.exit(0);
    }

    const market = await user.connect.reputationMarket.getMarket(profileId);
    const positivePrice = await user.connect.reputationMarket.getVotePrice(profileId, true);
    const negativePrice = await user.connect.reputationMarket.getVotePrice(profileId, false);
    const { trustVotes, distrustVotes } = await user.connect.reputationMarket.getUserVotes(
      wallet.address,
      profileId,
    );

    out(`📊 Market Info for Profile ID: ${profileId}`);
    out(`   Positive Votes: ${market.trustVotes}`);
    out(`   Negative Votes: ${market.distrustVotes}`);
    out(`   Positive Vote Price: ${formatEther(positivePrice)} ETH`);
    out(`   Negative Vote Price: ${formatEther(negativePrice)} ETH`);
    out(`   My Positive Votes: ${trustVotes}`);
    out(`   My Negative Votes: ${distrustVotes}`);
  }
}

export class MarketCommand extends Command {
  public readonly name = 'market';
  public readonly description = 'Manage reputation markets';
  public readonly subcommands = [
    new CreateMarket(),
    new BuyVotes(),
    new SellVotes(),
    new GetMarketInfo(),
  ];
}
